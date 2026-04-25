/* IA COMPUTEC - Asistente embebido con base de conocimiento local
   Motor NLU ligero: normalizacion, tokens, sinonimos, scoring ponderado y
   distancia de edicion para tolerar tipeos. No requiere API externa.
   Expone window.AIComputec con open(), close(), toggle(), ask(text). */
(function () {
    'use strict';

    const EXTERNAL_TUTOR_URL = 'https://computec-ai-tutor-31755169330.us-west1.run.app/';
    const HISTORY_KEY = 'aiComputecHistory';
    const HISTORY_LIMIT = 50;
    const SCORE_THRESHOLD = 2.2;

    const GEMINI_PROXY_URL = 'https://pcb-gemini-proxy.rvazquez-isspr.workers.dev/';
    const GEMINI_SYSTEM_PROMPT = `Eres IA COMPUTEC, el asistente virtual oficial de la Escuela Superior Vocacional Pablo Colón Berdécía (COMPUTEC) en Barranquitas, Puerto Rico.
Respondes preguntas sobre cursos de tecnología, horarios, inscripciones, servicios técnicos, proyectos estudiantiles y actividades escolares.
Mantiene un tono amigable, profesional y conciso. Responde siempre en español. No inventes información que no conoces; en ese caso, sugiere contactar la escuela.`;
    const TRAINING_CONTEXT_LIMIT = 4;

    const STOPWORDS = new Set([
        'a','al','algo','algun','alguna','algunas','alguno','algunos','ante','aqui',
        'como','con','cual','cuales','cuando','de','del','donde','el','ella','ellas',
        'ellos','en','entre','era','eres','es','esa','esas','ese','eso','esos','esta',
        'estan','estas','este','esto','estos','fue','fuera','ha','han','hay','la','las',
        'le','les','lo','los','mas','me','mi','mis','mucho','muy','ni','no','nos','o',
        'os','otra','otras','otro','otros','para','pero','por','porque','que','quien',
        'se','si','sin','sobre','soy','su','sus','te','tu','tus','un','una','unas','uno',
        'unos','ya','yo','sobre','segun','desde','hasta','e','u','y','favor','porfavor'
    ]);

    const SYNONYMS = {
        'costo': ['precio','pago','tarifa','cuesta','vale','costar','pagan','gratis'],
        'precio': ['costo','pago','tarifa','cuesta','vale'],
        'direccion': ['ubicacion','donde','lugar','localizacion','queda','estan'],
        'ubicacion': ['direccion','donde','lugar','queda','estan'],
        'horario': ['hora','horas','abren','cierran','atienden','abierto','disponible'],
        'telefono': ['numero','contacto','llamar','celular'],
        'correo': ['email','mail','gmail'],
        'inscripcion': ['matricula','registrarse','registro','inscribir','anotarme','apuntarme','inscripciones'],
        'requisitos': ['necesito','necesita','pide','piden','requiere','documentos'],
        'duracion': ['dura','tiempo','largo','meses','semanas'],
        'curso': ['clase','taller','programa','materia','cursos','clases','talleres'],
        'profesor': ['maestro','docente','instructor','profe'],
        'empleo': ['trabajo','salario','carrera','profesion','oficio'],
        'computadora': ['computador','pc','laptop','ordenador','maquina'],
        'certificado': ['certificacion','diploma','titulo'],
        'noticias': ['novedades','eventos','avisos'],
        'ia': ['inteligencia','artificial','ai','chatgpt','gemini'],
        'contacto': ['contactar','comunicarme','hablar','mensaje']
    };

    function normalize(text) {
        return String(text || '')
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\sñ?!.,'-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function tokenize(text) {
        const norm = normalize(text);
        const raw = norm.split(/[\s,.?!'-]+/).filter(Boolean);
        return raw.filter(tok => tok.length > 1 && !STOPWORDS.has(tok));
    }

    function expandTokens(tokens) {
        const out = new Set(tokens);
        tokens.forEach(tok => {
            const syns = SYNONYMS[tok];
            if (syns) syns.forEach(s => out.add(s));
        });
        return Array.from(out);
    }

    function editDistance(a, b) {
        if (a === b) return 0;
        if (!a.length) return b.length;
        if (!b.length) return a.length;
        const prev = new Array(b.length + 1);
        const curr = new Array(b.length + 1);
        for (let j = 0; j <= b.length; j++) prev[j] = j;
        for (let i = 1; i <= a.length; i++) {
            curr[0] = i;
            for (let j = 1; j <= b.length; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
            }
            for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
        }
        return prev[b.length];
    }

    function fuzzyMatch(token, keyword) {
        if (token === keyword) return 1;
        if (token.length < 4 || keyword.length < 4) return 0;
        if (keyword.includes(token) || token.includes(keyword)) return 0.85;
        const dist = editDistance(token, keyword);
        const maxLen = Math.max(token.length, keyword.length);
        if (dist <= 1) return 0.8;
        if (dist / maxLen <= 0.25) return 0.6;
        return 0;
    }

    function scoreEntry(entry, queryTokens, expanded, rawNormalized) {
        let score = 0;
        const kwList = entry._kwNorm || [];
        expanded.forEach(tok => {
            let best = 0;
            kwList.forEach(kw => {
                const weight = kw.w || 1;
                const m = fuzzyMatch(tok, kw.t);
                if (m) best = Math.max(best, m * weight);
            });
            score += best;
        });
        (entry._phrasesNorm || []).forEach(phrase => {
            if (phrase && rawNormalized.includes(phrase)) score += 2.5;
        });
        if (entry.tags) {
            entry.tags.forEach(tag => {
                const tn = normalize(tag);
                if (queryTokens.includes(tn)) score += 0.6;
            });
        }
        return score;
    }

    function prepareKB(kb) {
        kb.forEach(entry => {
            entry._kwNorm = (entry.keywords || []).map(k => {
                if (typeof k === 'string') return { t: normalize(k), w: 1 };
                return { t: normalize(k.t), w: k.w || 1 };
            });
            entry._phrasesNorm = (entry.phrases || []).map(p => normalize(p));
        });
    }

    const SMALL_TALK = [
        { match: ['hola','buenas','saludos','hey','qué tal','que tal','buenos dias','buenas tardes','buenas noches'], reply: '¡Hola! 👋 Soy IA COMPUTEC. Puedo contarte sobre los cursos, el horario, cómo inscribirte, los servicios técnicos o las carreras. ¿Qué te gustaría saber?' },
        { match: ['gracias','muchas gracias','thx','thanks'], reply: '¡Con gusto! Si necesitás algo más, preguntá sin problema.' },
        { match: ['adios','chao','hasta luego','bye','nos vemos'], reply: '¡Hasta luego! Éxitos y recordá que el equipo de COMPUTEC está disponible cuando lo necesites.' },
        { match: ['quien eres','que eres','que haces','en que me ayudas','ayuda','help'], reply: 'Soy el asistente de COMPUTEC. Te ayudo con información sobre <strong>cursos, horario, inscripción, requisitos, servicios técnicos, carreras y FAQ</strong>. Si no sé algo, puedo abrirte el <em>Tutor IA completo</em>.' }
    ];

    const KB = [
        {
            id: 'cursos',
            phrases: ['que cursos hay','cuales son los cursos','lista de cursos','que clases dan','que ensenan','que talleres tienen'],
            keywords: [{t:'cursos',w:2},{t:'curso',w:2},{t:'clases',w:1.5},{t:'taller',w:1.2},{t:'programa',w:1},{t:'ofrecen',w:1}],
            tags: ['cursos'],
            answer: `En COMPUTEC ofrecemos estos cursos:
<ul class="ai-list">
  <li><strong>Diagnóstico y reparación</strong> de computadoras</li>
  <li><strong>Administración de redes</strong> y cableado Cat5e/Cat6</li>
  <li><strong>Electricidad básica</strong> y fuentes de poder</li>
  <li><strong>Data Recovery</strong> (recuperación de datos)</li>
  <li><strong>Cloud Computing</strong></li>
  <li><strong>Ciberseguridad</strong></li>
  <li><strong>Programación básica</strong> (HTML, CSS, JS, Python)</li>
  <li><strong>Inteligencia Artificial</strong> aplicada y ética</li>
  <li><strong>Realidad Virtual</strong> y metaverso</li>
  <li><strong>Gaming</strong> y eSports</li>
  <li><strong>Impresión 3D</strong> y prototipado</li>
</ul>`,
            chips: ['¿Cuánto duran los cursos?','¿Dan certificado?','¿Qué requisitos piden?']
        },
        {
            id: 'curso-reparacion',
            phrases: ['reparacion de computadoras','diagnostico y reparacion','arreglar computadoras'],
            keywords: [{t:'reparacion',w:2},{t:'reparar',w:1.5},{t:'diagnostico',w:1.5},{t:'hardware',w:1},{t:'computadoras',w:1}],
            tags: ['reparacion'],
            answer: 'El curso de <strong>Diagnóstico y Reparación</strong> cubre identificación de fallas, reemplazo de componentes, mantenimiento preventivo e instalación de sistemas operativos. Es uno de los cursos insignia de COMPUTEC.',
            chips: ['¿Qué herramientas usan?','Ver todos los cursos']
        },
        {
            id: 'curso-ia',
            phrases: ['curso de ia','clases de inteligencia artificial','aprender ia'],
            keywords: [{t:'inteligencia',w:2},{t:'artificial',w:2},{t:'ia',w:2},{t:'machine',w:1.5},{t:'learning',w:1.5},{t:'generativa',w:1}],
            tags: ['ia','inteligencia artificial'],
            answer: 'El curso de <strong>Inteligencia Artificial</strong> cubre fundamentos de IA, machine learning básico, herramientas generativas, ética en IA y aplicaciones al aprendizaje.',
            chips: ['¿Qué otros cursos hay?','¿Dan certificado?']
        },
        {
            id: 'curso-ciberseguridad',
            phrases: ['curso de ciberseguridad','clases de seguridad informatica'],
            keywords: [{t:'ciberseguridad',w:2},{t:'seguridad',w:1.5},{t:'hackers',w:1},{t:'malware',w:1},{t:'phishing',w:1},{t:'ransomware',w:1}],
            tags: ['ciberseguridad'],
            answer: 'En <strong>Ciberseguridad</strong> aprendés fundamentos de seguridad, protección contra malware, contraseñas seguras, autenticación de dos factores y prevención de ingeniería social.',
            chips: ['¿Qué carreras hay en ciberseguridad?']
        },
        {
            id: 'curso-programacion',
            phrases: ['curso de programacion','aprender a programar','clases de codigo'],
            keywords: [{t:'programacion',w:2},{t:'programar',w:1.5},{t:'codigo',w:1.2},{t:'html',w:1},{t:'css',w:1},{t:'javascript',w:1},{t:'python',w:1.2}],
            tags: ['programacion'],
            answer: 'El curso de <strong>Programación Básica</strong> incluye HTML5, CSS3, JavaScript, introducción a Python y proyectos web reales.',
            chips: ['¿Hay desarrollo web?','Ver todos los cursos']
        },
        {
            id: 'curso-redes',
            phrases: ['curso de redes','administracion de redes'],
            keywords: [{t:'redes',w:2},{t:'red',w:1.5},{t:'router',w:1},{t:'switch',w:1},{t:'cableado',w:1.2},{t:'cat5e',w:1},{t:'cat6',w:1}],
            tags: ['redes'],
            answer: 'El curso de <strong>Administración de Redes</strong> cubre routers, switches, firewalls, cableado estructurado Cat5e/Cat6 y conectividad.',
            chips: ['¿Qué carreras hay en redes?']
        },
        {
            id: 'horario',
            phrases: ['cual es el horario','a que hora abren','horario de atencion','cuando atienden'],
            keywords: [{t:'horario',w:2},{t:'hora',w:1.5},{t:'abren',w:1.5},{t:'cierran',w:1.2},{t:'atienden',w:1.2},{t:'disponible',w:1}],
            tags: ['horario'],
            answer: 'El <strong>horario de capacitación es de 7:30 AM - 8:30 AM</strong>. Si necesitas confirmar disponibilidad adicional, usa la sección de contacto.',
            chips: ['¿Dónde están ubicados?','Contacto']
        },
        {
            id: 'ubicacion',
            phrases: ['donde estan ubicados','donde queda la escuela','direccion de computec','como llegar'],
            keywords: [{t:'direccion',w:2},{t:'ubicacion',w:2},{t:'donde',w:1.5},{t:'queda',w:1.2},{t:'llegar',w:1},{t:'barranquitas',w:2}],
            tags: ['ubicacion'],
            answer: 'Estamos en la <strong>Escuela Superior Vocacional Pablo Colón Berdecía</strong>, Carretera 156 salida hacia Comerío, <strong>Barranquitas, Puerto Rico</strong>.',
            chips: ['¿Cuál es el horario?','Contacto']
        },
        {
            id: 'contacto',
            phrases: ['como contactarlos','como comunicarme','quiero contactar','numero de telefono','correo electronico'],
            keywords: [{t:'contacto',w:2},{t:'telefono',w:1.5},{t:'correo',w:1.5},{t:'email',w:1.5},{t:'comunicarme',w:1.2},{t:'hablar',w:1}],
            tags: ['contacto'],
            answer: 'Podés escribirnos a <a href="mailto:de167766@miescuela.pr">de167766@miescuela.pr</a> o llamar al <strong>(787) 123-4567</strong>. También podés usar el formulario en la sección <a href="#contacto">Contacto</a>.',
            chips: ['¿Dónde están?','¿Cuál es el horario?']
        },
        {
            id: 'inscripcion',
            phrases: ['como me inscribo','como inscribirme','quiero inscribirme','como matricularme','proceso de inscripcion'],
            keywords: [{t:'inscripcion',w:2},{t:'inscribirme',w:2},{t:'matricula',w:1.8},{t:'registrarme',w:1.5},{t:'anotarme',w:1.2},{t:'apuntarme',w:1.2}],
            tags: ['inscripcion'],
            answer: 'Para inscribirte debés estar matriculado en la Escuela Superior Vocacional Pablo Colón Berdecía y completar el formulario de contacto. No se pide experiencia previa para los cursos básicos. Si querés, te llevo a la sección <a href="#admision">Admisión</a>.',
            chips: ['¿Qué requisitos piden?','¿Tiene costo?','Contacto']
        },
        {
            id: 'costo',
            phrases: ['cuanto cuesta','cual es el precio','tiene costo','es gratis','precio del curso'],
            keywords: [{t:'costo',w:2},{t:'precio',w:2},{t:'cuesta',w:1.8},{t:'pago',w:1.5},{t:'tarifa',w:1.2},{t:'gratis',w:1.5}],
            tags: ['costo'],
            answer: 'COMPUTEC es un curso técnico de la <strong>Escuela Superior Vocacional Pablo Colón Berdecía</strong>, por lo que forma parte del programa escolar público. Para detalles de costos o material, consultá directamente en la escuela.',
            chips: ['¿Cómo me inscribo?','Contacto']
        }
    ];

    const FAQ_KB = [
        {
            id: 'faq-requisitos',
            phrases: ['que requisitos piden','cuales son los requisitos','que se necesita para entrar'],
            keywords: [{t:'requisitos',w:2},{t:'necesito',w:1.5},{t:'pide',w:1.2},{t:'documentos',w:1}],
            answer: 'Los requisitos básicos son: estar <strong>matriculado en la Escuela Pablo Colón Berdecía</strong>, tener interés en tecnología y completar el formulario de inscripción. No se pide experiencia previa para cursos básicos.',
            chips: ['¿Cómo me inscribo?','¿Dan certificado?']
        },
        {
            id: 'faq-duracion',
            phrases: ['cuanto dura el curso','cuanto duran los cursos','duracion de los cursos'],
            keywords: [{t:'duracion',w:2},{t:'dura',w:2},{t:'tiempo',w:1.2},{t:'meses',w:1.5},{t:'semanas',w:1}],
            answer: 'Los <strong>cursos básicos duran 3–4 meses</strong> y los <strong>avanzados entre 5–6 meses</strong>. Todos incluyen práctica intensiva y proyectos reales.',
            chips: ['¿Dan certificado?','Ver cursos']
        },
        {
            id: 'faq-certificado',
            phrases: ['dan certificado','recibire un certificado','hay diploma'],
            keywords: [{t:'certificado',w:2},{t:'certificacion',w:1.8},{t:'diploma',w:1.8},{t:'titulo',w:1.2}],
            answer: 'Sí. Al completar satisfactoriamente un curso recibís un <strong>certificado oficial de COMPUTEC</strong> que valida los conocimientos y habilidades adquiridas.',
            chips: ['¿Cuánto dura el curso?','Oportunidades de empleo']
        },
        {
            id: 'faq-laptop',
            phrases: ['necesito traer laptop','debo traer computadora','hay que tener pc'],
            keywords: [{t:'laptop',w:2},{t:'traer',w:1.5},{t:'propia',w:1.2},{t:'equipo',w:1},{t:'computadora',w:1.2}],
            answer: 'No es obligatorio. COMPUTEC cuenta con <strong>laboratorios equipados</strong>. Si preferís trabajar en tu propia laptop, también sos bienvenido.',
            chips: ['¿Qué cursos hay?']
        },
        {
            id: 'faq-empleo',
            phrases: ['hay oportunidades de trabajo','puedo conseguir empleo','salidas laborales'],
            keywords: [{t:'empleo',w:2},{t:'trabajo',w:2},{t:'graduarme',w:1.5},{t:'pasantias',w:1.5},{t:'carrera',w:1},{t:'salario',w:1}],
            answer: 'Sí, tenemos <strong>alianzas con empresas tecnológicas locales</strong> que ofrecen pasantías y oportunidades laborales a nuestros graduados. También ayudamos con portafolio y CV.',
            chips: ['¿Qué carreras puedo seguir?']
        },
        {
            id: 'faq-multiples',
            phrases: ['puedo tomar varios cursos','varios cursos a la vez','mas de un curso'],
            keywords: [{t:'varios',w:1.8},{t:'simultaneamente',w:1.5},{t:'ambos',w:1.2},{t:'multiples',w:1.2}],
            answer: 'Depende de tu disponibilidad. A estudiantes nuevos les recomendamos empezar con uno. Los avanzados pueden tomar hasta <strong>dos cursos simultáneamente</strong> con aprobación del instructor.',
            chips: ['Ver cursos']
        },
        {
            id: 'faq-gaming',
            phrases: ['que es gaming day','en que consiste el gaming day','cuando es gaming day'],
            keywords: [{t:'gaming',w:2},{t:'esports',w:1.5},{t:'torneo',w:1.5},{t:'videojuegos',w:1.5},{t:'evento',w:1}],
            answer: 'El <strong>Gaming Day</strong> es el evento anual donde celebramos tecnología y videojuegos: torneos de eSports, competencias, premios y actividades recreativas. Está abierto a toda la escuela.',
            chips: ['¿Hay noticias próximas?']
        },
        {
            id: 'faq-servicios-maestros',
            phrases: ['como solicitar servicio tecnico','servicios para maestros','ayuda tecnica'],
            keywords: [{t:'servicios',w:2},{t:'servicio',w:2},{t:'maestros',w:1.8},{t:'tecnico',w:1.5},{t:'reparacion',w:1},{t:'soporte',w:1.5}],
            tags: ['servicios'],
            answer: `Los maestros pueden solicitar servicios técnicos en la sección
<a href="#servicios-tecnicos">Servicios Técnicos</a> o visitando directamente el taller de COMPUTEC. Ofrecemos:
<ul class="ai-list">
  <li>Reparación de equipos</li>
  <li>Instalación de software</li>
  <li>Soporte de red</li>
  <li>Configuración de proyectores</li>
</ul>
Atendemos solicitudes de lunes a viernes.`,
            chips: ['¿Cuál es el horario?','Contacto']
        },
        {
            id: 'carreras',
            phrases: ['que carreras puedo seguir','oportunidades de empleo','salidas profesionales'],
            keywords: [{t:'carreras',w:2},{t:'profesion',w:1.5},{t:'salida',w:1.2},{t:'oportunidades',w:1.5}],
            answer: `COMPUTEC te prepara para carreras como:
<ul class="ai-list">
  <li>Desarrollador de Software</li>
  <li>Técnico en Soporte Informático</li>
  <li>Administrador de Redes</li>
  <li>Especialista en Ciberseguridad</li>
  <li>Desarrollador Web</li>
  <li>Programador de Aplicaciones</li>
  <li>Técnico en Mantenimiento</li>
  <li>Analista de Sistemas</li>
</ul>
Ver detalles en la sección <a href="#cursos">Cursos · Oportunidades</a>.`,
            chips: ['¿Qué cursos hay?','¿Dan certificado?']
        },
        {
            id: 'proyectos',
            phrases: ['que proyectos hacen','proyectos de estudiantes','ejemplos de trabajos'],
            keywords: [{t:'proyectos',w:2},{t:'proyecto',w:2},{t:'estudiantes',w:1.2},{t:'ejemplos',w:1}],
            answer: 'Nuestros estudiantes desarrollan proyectos reales como <strong>PCB System</strong> (página oficial de la escuela), <strong>Casa Abierta</strong>, la <strong>Unidad de Apoyo Socioemocional</strong>, <strong>Gaming Day Fall/Spring</strong> y el sitio de <strong>Servicios Técnicos</strong>. Mirá todos en <a href="#proyectos">Proyectos</a>.',
            chips: ['¿Qué cursos hay?','Contacto']
        },
        {
            id: 'tour',
            phrases: ['quiero un tour','recorrido por la pagina','mostrame la pagina'],
            keywords: [{t:'tour',w:2},{t:'recorrido',w:1.5},{t:'guiado',w:1.5},{t:'mostrame',w:1}],
            answer: 'Podés iniciar un <strong>tour guiado</strong> desde el botón correspondiente del sitio, o te llevo directo a la sección que prefieras: <a href="#sobre-nosotros">Sobre nosotros</a>, <a href="#cursos">Cursos</a>, <a href="#proyectos">Proyectos</a> o <a href="#contacto">Contacto</a>.',
            chips: ['Ver cursos','Contacto']
        },
        {
            id: 'acerca',
            phrases: ['que es computec','de que se trata computec','mision de computec','vision de computec'],
            keywords: [{t:'computec',w:2},{t:'escuela',w:1.2},{t:'mision',w:1.5},{t:'vision',w:1.5},{t:'quienes',w:1.2}],
            answer: 'COMPUTEC es el <strong>curso técnico de tecnología</strong> de la Escuela Superior Vocacional Pablo Colón Berdecía (Barranquitas, PR). Formamos estudiantes en diagnóstico y reparación de computadoras, redes, programación, IA, ciberseguridad y más, desde 2009.',
            chips: ['Ver cursos','¿Dónde están?']
        }
    ];

    KB.push.apply(KB, FAQ_KB);
    prepareKB(KB);

    function smallTalkReply(normalized) {
        for (const st of SMALL_TALK) {
            for (const phrase of st.match) {
                const p = normalize(phrase);
                if (normalized === p || normalized.startsWith(p + ' ') || normalized.endsWith(' ' + p) || normalized.includes(' ' + p + ' ')) {
                    return st.reply;
                }
            }
        }
        return null;
    }

    function dynamicNews(normalized) {
        if (!/(noticia|novedad|evento|proximo|avisos|ultimas)/.test(normalized)) return null;
        try {
            if (typeof window.getNews !== 'function') return null;
            const list = window.getNews() || [];
            if (!list.length) return null;
            const now = new Date();
            const active = list.filter(n => {
                const status = n.status || 'published';
                if (status === 'draft') return false;
                if (status === 'scheduled' && (!n.publishAt || new Date(n.publishAt) > now)) return false;
                return true;
            }).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
            if (!active.length) return null;
            const items = active.map(n => `<li><strong>${escapeHtml(n.title)}</strong> — ${escapeHtml(n.content.slice(0, 140))}${n.content.length > 140 ? '…' : ''}</li>`).join('');
            return {
                answer: `Estas son las últimas novedades de COMPUTEC:<ul class="ai-list">${items}</ul>`,
                chips: ['¿Qué cursos hay?','¿Cuándo es Gaming Day?','Contacto']
            };
        } catch (_) { return null; }
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    const FOLLOWUP_WORDS = ['ese','esa','eso','este','esta','esto','ahi','alli','mismo','el','la'];

    const state = {
        lastTopic: null,
        history: []
    };

    function query(text) {
        const normalized = normalize(text);
        if (!normalized) return { answer: 'Escribí tu pregunta y te ayudo 😊', chips: [] };

        const st = smallTalkReply(normalized);
        if (st) return { answer: st, chips: ['¿Qué cursos hay?','¿Cuál es el horario?','Contacto'] };

        const dyn = dynamicNews(normalized);
        if (dyn) { state.lastTopic = 'noticias'; return dyn; }

        let tokens = tokenize(normalized);
        const hasFollowup = tokens.some(t => FOLLOWUP_WORDS.includes(t)) || tokens.length <= 2;
        if (hasFollowup && state.lastTopic) {
            tokens = tokens.concat(tokenize(state.lastTopic));
        }
        const expanded = expandTokens(tokens);

        let best = null;
        let bestScore = 0;
        KB.forEach(entry => {
            const s = scoreEntry(entry, tokens, expanded, normalized);
            if (s > bestScore) { bestScore = s; best = entry; }
        });

        if (best && bestScore >= SCORE_THRESHOLD) {
            state.lastTopic = best.id;
            return { answer: best.answer, chips: best.chips || [] };
        }

        const suggestions = KB
            .map(e => ({ e, s: scoreEntry(e, tokens, expanded, normalized) }))
            .filter(x => x.s > 0)
            .sort((a, b) => b.s - a.s)
            .slice(0, 3)
            .map(x => x.e);

        if (suggestions.length) {
            const chips = suggestions.map(s => (s.phrases && s.phrases[0]) || s.id).map(titleCase);
            return {
                answer: 'No estoy seguro de haber entendido. ¿Te referís a alguno de estos temas?',
                chips: chips.concat(['Abrir tutor IA completo'])
            };
        }

        return {
            answer: 'No tengo una respuesta exacta para eso. Podés reformular la pregunta o abrir el <strong>Tutor IA completo</strong> para una conversación más amplia.',
            chips: ['¿Qué cursos hay?','¿Cómo me inscribo?','Contacto','Abrir tutor IA completo']
        };
    }

    function titleCase(s) {
        return s.replace(/\b\w/g, ch => ch.toUpperCase());
    }

    // ===================== UI =====================

    let root, messagesEl, inputEl, panelEl, toggleBtn, chipsEl, badgeEl;
    let isOpen = false;
    let unread = 0;
    let typingTimer = null;

    function renderMessage(role, html) {
        const wrap = document.createElement('div');
        wrap.className = 'ai-msg ai-msg-' + role;
        if (role === 'bot') {
            wrap.innerHTML = `<div class="ai-avatar"><i class="fa-solid fa-robot" aria-hidden="true"></i></div><div class="ai-bubble">${html}</div>`;
        } else {
            wrap.innerHTML = `<div class="ai-bubble">${escapeHtml(html)}</div>`;
        }
        messagesEl.appendChild(wrap);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return wrap;
    }

    function showTyping() {
        const el = document.createElement('div');
        el.className = 'ai-msg ai-msg-bot ai-typing';
        el.innerHTML = `<div class="ai-avatar"><i class="fa-solid fa-robot" aria-hidden="true"></i></div>
            <div class="ai-bubble"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span></div>`;
        messagesEl.appendChild(el);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return el;
    }

    function renderChips(chips) {
        chipsEl.innerHTML = '';
        (chips || []).forEach(txt => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'ai-chip';
            b.textContent = txt;
            b.addEventListener('click', () => {
                if (/tutor ia completo/i.test(txt)) {
                    window.open(EXTERNAL_TUTOR_URL, '_blank', 'noopener,noreferrer');
                    return;
                }
                submitUser(txt);
            });
            chipsEl.appendChild(b);
        });
    }

    function saveHistory() {
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history.slice(-HISTORY_LIMIT)));
        } catch (_) {}
    }

    function loadHistory() {
        try {
            const raw = localStorage.getItem(HISTORY_KEY);
            if (!raw) return [];
            return JSON.parse(raw) || [];
        } catch (_) { return []; }
    }

    function stripHtml(value) {
        return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    function buildKnowledgeContext(userText) {
        const normalized = normalize(userText);
        if (!normalized) return '';

        const tokens = tokenize(normalized);
        const expanded = expandTokens(tokens);

        const ranked = KB
            .map(entry => ({
                entry,
                score: scoreEntry(entry, tokens, expanded, normalized)
            }))
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, TRAINING_CONTEXT_LIMIT)
            .map(item => {
                const title = item.entry.id || 'tema';
                const answer = stripHtml(item.entry.answer || '');
                return `- ${title}: ${answer}`;
            });

        return ranked.length
            ? `Contexto institucional de COMPUTEC (usar como fuente principal):\n${ranked.join('\n')}`
            : '';
    }

    async function queryGemini(text) {
        const kbContext = buildKnowledgeContext(text);
        const historyContext = state.history
            .filter(m => m.role === 'user' || m.role === 'bot')
            .slice(-10)
            .map(m => ({
                role: m.role === 'user' ? 'Usuario' : 'IA COMPUTEC',
                text: m.role === 'user' ? m.text : stripHtml(m.html || '')
            }))
            .map(m => `${m.role}: ${m.text}`)
            .join('\n');

        const prompt = [
            GEMINI_SYSTEM_PROMPT,
            kbContext ? `Contexto útil:\n${kbContext}` : '',
            historyContext ? `Historial reciente:\n${historyContext}` : '',
            `Pregunta del usuario: ${text}`
        ]
            .filter(Boolean)
            .join('\n\n');

        const res = await fetch(GEMINI_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: prompt })
        });

        if (!res.ok) {
            throw new Error(`Gemini API error ${res.status}`);
        }

        const data = await res.json();
        const answer = data?.reply || data?.text || 'No pude obtener una respuesta. Intenta de nuevo.';
        return answer;
    }

    function submitUser(rawText) {
        const text = String(rawText || '').trim();
        if (!text) return;
        inputEl.value = '';
        renderMessage('user', text);
        state.history.push({ role: 'user', text, ts: Date.now() });

        const typingEl = showTyping();
        clearTimeout(typingTimer);

        queryGemini(text)
            .then(answer => {
                typingEl.remove();
                renderMessage('bot', escapeHtml(answer).replace(/\n/g, '<br>'));
                renderChips(['¿Qué cursos hay?','¿Cómo me inscribo?','Contacto']);
                state.history.push({ role: 'bot', html: answer, chips: [], ts: Date.now() });
                saveHistory();
                if (!isOpen) bumpUnread();
            })
            .catch(err => {
                typingEl.remove();
                const fallback = query(text);
                renderMessage('bot', `${fallback.answer}<br><small>Modo local activado temporalmente.</small>`);
                renderChips(fallback.chips);
                state.history.push({ role: 'bot', html: fallback.answer, chips: fallback.chips, ts: Date.now() });
                saveHistory();
                console.error('Gemini error:', err);
            });
    }

    function bumpUnread() {
        unread += 1;
        if (badgeEl) {
            badgeEl.textContent = String(unread);
            badgeEl.hidden = false;
        }
    }

    function clearUnread() {
        unread = 0;
        if (badgeEl) { badgeEl.textContent = '0'; badgeEl.hidden = true; }
    }

    function open() {
        if (!panelEl) return;
        isOpen = true;
        panelEl.classList.add('ai-open');
        panelEl.setAttribute('aria-hidden', 'false');
        toggleBtn.setAttribute('aria-expanded', 'true');
        clearUnread();
        setTimeout(() => inputEl && inputEl.focus(), 100);
    }

    function close() {
        if (!panelEl) return;
        isOpen = false;
        panelEl.classList.remove('ai-open');
        panelEl.setAttribute('aria-hidden', 'true');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.focus();
    }

    function toggle() { isOpen ? close() : open(); }

    function clearConversation() {
        state.history = [];
        state.lastTopic = null;
        messagesEl.innerHTML = '';
        saveHistory();
        greet();
    }

    function greet() {
        const hour = new Date().getHours();
        const salute = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
        renderMessage('bot', `${salute} 👋 Soy <strong>IA COMPUTEC</strong>. Puedo ayudarte con cursos, horario, inscripción, servicios técnicos, carreras y más. ¿Qué necesitás saber?`);
        renderChips(['¿Qué cursos hay?','¿Cuánto duran?','¿Dan certificado?','¿Cómo me inscribo?','¿Tienen servicios técnicos?','¿Cuál es el horario?','¿Dónde están?','Contacto']);
    }

    function replayHistory() {
        const saved = loadHistory();
        if (!saved.length) { greet(); return; }
        state.history = saved;
        saved.forEach(m => {
            if (m.role === 'user') renderMessage('user', m.text);
            else renderMessage('bot', m.html);
        });
        const last = saved[saved.length - 1];
        renderChips(last && last.role === 'bot' && last.chips ? last.chips : ['¿Qué cursos hay?','¿Cuál es el horario?','Contacto']);
    }

    function build() {
        root = document.getElementById('ai-assistant-root');
        if (!root) return false;
        panelEl = root.querySelector('.ai-panel');
        messagesEl = root.querySelector('.ai-messages');
        chipsEl = root.querySelector('.ai-chips');
        inputEl = root.querySelector('.ai-input');
        toggleBtn = document.getElementById('ai-toggle-btn');
        badgeEl = toggleBtn ? toggleBtn.querySelector('.ai-badge') : null;
        if (!panelEl || !messagesEl || !inputEl || !toggleBtn) return false;

        toggleBtn.addEventListener('click', toggle);
        root.querySelector('.ai-close-btn').addEventListener('click', close);
        root.querySelector('.ai-clear-btn').addEventListener('click', clearConversation);
        root.querySelectorAll('.ai-external-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                window.open(EXTERNAL_TUTOR_URL, '_blank', 'noopener,noreferrer');
            });
        });
        root.querySelector('.ai-form').addEventListener('submit', (e) => {
            e.preventDefault();
            submitUser(inputEl.value);
        });
        document.addEventListener('click', (e) => {
            if (!isOpen) return;
            if (panelEl.contains(e.target) || toggleBtn.contains(e.target)) {
                return;
            }
            if (!root.contains(e.target)) {
                close();
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen) close();
        });
        return true;
    }

    function boot() {
        if (!build()) return;
        replayHistory();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    window.AIComputec = {
        open, close, toggle, ask: submitUser, clear: clearConversation,
        _internals: { normalize, tokenize, expandTokens, editDistance, query, KB, state, SCORE_THRESHOLD }
    };
})();



