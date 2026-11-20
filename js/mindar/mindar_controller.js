import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';

// Medidas en "unidades de sticker": 1 unidad = el ancho del sticker pegado en el jarrón.
// El eje de arriba del sticker es el de arriba del jarrón.
const STICKER_PX_ANCHO = 1008;            // medidas de la imagen del sticker con la que se generó targets.mind
const STICKER_PX_ALTO = 1600;
const ALTO_STICKER = STICKER_PX_ALTO / STICKER_PX_ANCHO; // alto del sticker en unidades (su ancho = 1)
const ANCHO_VIDEO = 1.4;                  // ancho del video del dragón. Súbelo para un dragón más grande
const ALTO_VIDEO = ANCHO_VIDEO * 1280 / 720; // el video mide 720 x 1280, así no se deforma
const SUBIR = -0.2;                       // dónde queda el borde de abajo del video. 0 = en el centro del sticker, 0.75 = en el borde de arriba del sticker, 1.05 = más o menos en la boca del jarrón, -0.75 = en el borde de abajo
const ADELANTE = 0.02;                    // separación del video respecto a la superficie del jarrón

// Nubes que acompañan al dragón. Posiciones en unidades de sticker (x: izquierda -, derecha +  /  y: arriba +).
// El dragón ocupa x entre -0.6 y 0.6. La y se mide desde el borde de abajo del video (SUBIR), así que si subes el video, las nubes suben con él.
// atras: true = la nube va detrás del dragón, false = delante.
// entra: segundo del video en que empieza a aparecer. deriva: cuánto se mece de lado a lado.
// Para quitar una nube, borra su línea. Para no usar nubes, deja la lista vacía: const NUBES = [];
const NUBES = [
    { archivo: 'assets/img/nube-2.png', ancho: 0.55, x: -0.95, y: 0.35, atras: true,  entra: 0.3, deriva: 0.06, vel: 0.6, lado: -1 },
    { archivo: 'assets/img/nube-1.png', ancho: 0.75, x: 1.00,  y: 1.00, atras: false, entra: 0.9, deriva: 0.08, vel: 0.5, lado: 1 },
    { archivo: 'assets/img/nube-3.png', ancho: 0.70, x: -0.50, y: 1.55, atras: true,  entra: 1.5, deriva: 0.07, vel: 0.4, lado: -1 },
    { archivo: 'assets/img/nube-4.png', ancho: 0.40, x: 0.55,  y: 2.00, atras: false, entra: 2.1, deriva: 0.05, vel: 0.7, lado: 1 },
    // Nubes de abajo, a los lados del sticker (el sticker ocupa x entre -0.5 y 0.5, así que estas quedan fuera de él)
    { archivo: 'assets/img/nube-3.png', ancho: 0.60, x: -0.95, y: -0.35, atras: true,  entra: 0.6, deriva: 0.07, vel: 0.45, lado: -1 },
    { archivo: 'assets/img/nube-4.png', ancho: 0.35, x: 0.83,  y: -0.55, atras: false, entra: 1.2, deriva: 0.05, vel: 0.65, lado: 1 },
    { archivo: 'assets/img/nube-1.png', ancho: 0.70, x: -1.00, y: -1.00, atras: false, entra: 1.8, deriva: 0.08, vel: 0.40, lado: -1 },
    { archivo: 'assets/img/nube-2.png', ancho: 0.50, x: 0.90,  y: -1.15, atras: true,  entra: 2.4, deriva: 0.06, vel: 0.55, lado: 1 },
    { archivo: 'assets/img/nube-4.png', ancho: 0.30, x: -0.80, y: -1.50, atras: false, entra: 3.0, deriva: 0.05, vel: 0.75, lado: -1 },
];

// Segundos que pasan desde que se detecta el sticker hasta que arranca el video del dragón.
// En ese tiempo solo se ven el halo y el brillo de los ojos, como si el dragón se estuviera despertando. 0 = arranca de una.
const RETRASO_VIDEO = 2;

// Velocidad del video: 1 = normal, 0.8 = más lento (el video de 8 s dura 10 s)
const VELOCIDAD_VIDEO = 0.8;

// Efecto etéreo del dragón
const OPACIDAD_DRAGON = 0.92;  // 1 = totalmente sólido, más bajo = más transparente
const BRILLO_DRAGON = 0.12;    // cuánto se aclara hacia un blanco azulado (0 = nada)
const FUNDIDO_BASE = 0.18;     // qué parte de abajo del video se desvanece (0 = nada), así el dragón sale de la neblina

// Neblina. Posiciones en unidades de sticker, igual que las nubes (la y se mide desde el borde de abajo del video).
// op: qué tan visible es (0 a 1). atras: true = detrás del dragón, false = delante.
// Para menos neblina baja los op, para quitarla deja la lista vacía: const BRUMA = [];
const BRUMA = [
    { x: 0.00,  y: 0.10, ancho: 3.0, alto: 1.3, op: 0.80, atras: true, vel: 0.35, deriva: 0.15 }, // la de la base, donde nace el dragón
    { x: -0.40, y: 0.60, ancho: 2.6, alto: 1.2, op: 0.60, atras: true, vel: 0.30, deriva: 0.20 },
    { x: 0.40,  y: 1.00, ancho: 2.6, alto: 1.2, op: 0.60, atras: true, vel: 0.28, deriva: 0.20 },
    { x: -0.20, y: 1.50, ancho: 2.8, alto: 1.2, op: 0.65, atras: true, vel: 0.25, deriva: 0.18 },
    { x: 0.30,  y: 2.00, ancho: 2.8, alto: 1.2, op: 0.75, atras: true, vel: 0.30, deriva: 0.15 }, // arriba, por donde el dragón se va
    { x: -0.10, y: 2.45, ancho: 2.8, alto: 1.2, op: 0.75, atras: true, vel: 0.22, deriva: 0.15 },
    { x: 0.20,  y: 2.80, ancho: 2.6, alto: 1.1, op: 0.60, atras: true, vel: 0.26, deriva: 0.12 },
];

// Ojos del dragón del sticker. Posición en píxeles de la imagen del sticker (1008 x 1600). tam = tamaño del brillo en unidades de sticker.
const OJOS_STICKER = [
    { x: 384, y: 384, tam: 0.12 },  // ojo grande
    { x: 329, y: 378, tam: 0.065 }, // ojo pequeño
];
const COLOR_OJOS_STICKER = 0x7fe3ff;   // celeste claro
const INTENSIDAD_OJOS_STICKER = 0.9;   // 0 a 1

// Halo de luz que bordea al dragón del sticker (imagen assets/img/halo-dragon.png, calzada con el sticker)
const COLOR_HALO = 0x9fd8ff;       // celeste muy claro
const INTENSIDAD_HALO = 0.9;       // 0 a 1. Más bajo = más sutil

// Ojos del dragón del video cuando ruge (brillo blanco). Cada fila es [segundo del video, ojo izquierdo x, y, ojo derecho x, y] en píxeles del video (720 x 1280).
const OJOS_RUGIDO = [
    [3.2, 315, 413, 407, 412],
    [3.4, 312, 435, 409, 434],
    [3.6, 311, 429, 412, 429],
    [3.8, 309, 430, 418, 428],
    [4.0, 311, 432, 423, 430],
    [4.2, 314, 432, 423, 430],
    [4.4, 321, 428, 423, 428],
    [4.6, 325, 422, 422, 422],
];
const RUGIDO_INICIO = 3.2;   // segundo en que empieza a encenderse
const RUGIDO_FIN = 4.6;      // segundo en que ya se apagó
const TAM_OJOS_RUGIDO = ANCHO_VIDEO * 0.133; // tamaño del brillo en unidades de sticker
const INTENSIDAD_RUGIDO = 1;  // 0 a 1

class MindARController {

    constructor(container, threePlayer, debug = false) {
        this.container = container;
        this.threePlayer = threePlayer;
        this.debug = debug;
        this.isMobile = /Android|iPhone|iPod|iPad/i.test(navigator.userAgent);

        // Archivo compilado a partir de la imagen del sticker
        this.imageTargetSrc = 'assets/marker/targets.mind';

        this.mindar = null;
        this.anchors = [];
        this.started = false;

        this.listeners = {
            start: [],
            found: [],
            lost: [],
            update: [],
        };
    }

    addListener(type, callback) { this.listeners[type].push(callback); }

    dispatch(type, event) {
        for (const listener of this.listeners[type]) {
            listener(event);
        }
    }

    async start() {

        if (this.started) return;

        // Limpia restos de un intento anterior (p.ej. un <video> huérfano).
        if (this.mindar) { this.stop(); }
        this.container.replaceChildren();

        const player = this.threePlayer;
        const imageTargets = player?.imageTargets;

        if (!imageTargets || !imageTargets.length) {
            throw new Error('player.imageTargets está vacío. Asegurate de que los scripts de la escena se ejecutaron.');
        }

        this.mindar = new MindARThree({
            container: this.container,
            imageTargetSrc: this.imageTargetSrc,
            filterMinCF: 0.00005,
            filterBeta: 20,
            warmupTolerance: 3,
            missTolerance: 12,
            uiLoading: 'no',
            uiScanning: 'no',
            uiError: 'yes',
        });

        const { scene, camera, renderer } = this.mindar;

        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0x000000, 0);

        const it = imageTargets[0];
        const content = it.arContent;
        let activo = false;

        // El contenido cuelga de este nodo y no directo del marcador.
        // Cada cuadro seguimos al marcador con amortiguación para quitar el temblor.
        const SUAVIDAD = 0.08; // segundos: más alto = más suave pero más lento
        const suavizado = new THREE.Group();
        scene.add(suavizado);
        let primera = true;
        const posObj = new THREE.Vector3();
        const quatObj = new THREE.Quaternion();
        const escObj = new THREE.Vector3();
        let ultimo = performance.now();

        let planoDragon = null; // el plano del video, para esconderlo mientras el dragón "despierta"
        if (content) {
            // El plano del video se pone justo encima del sticker, sin las transformaciones del editor
            content.position.set(0, 0, 0);
            content.rotation.set(0, 0, 0);
            content.scale.set(1, 1, 1);

            // Busca el plano del video por nombre ("Dragon" o "video Dragon")
            let dragon = null;
            content.traverse((o) => { if (!dragon && o.isMesh && /dragon/i.test(o.name)) dragon = o; });
            planoDragon = dragon;
            if (dragon) {
                // El dragón sale desde el borde de abajo del video: ese borde se apoya en el jarrón y el dragón sube
                dragon.position.set(0, SUBIR + ALTO_VIDEO / 2, ADELANTE);
                dragon.rotation.set(0, 0, 0);
                dragon.scale.set(ANCHO_VIDEO, ALTO_VIDEO, 1);
                dragon.renderOrder = 2;
                this.volverEtereo(dragon);
            } else {
                console.warn('No se encontró el plano del video (Dragon) en app.json');
            }

            this.crearNubes(content);
            this.crearBruma(content);
            this.crearOjos(content);
            this.crearHalo(content);
            this.ajustarVelocidad(player);

            content.visible = false;
            suavizado.add(content);
        }

        // Un solo marcador: el sticker (target 0 dentro de targets.mind)
        const anchor = this.mindar.addAnchor(0);

        if (this.debug) {
            this.addMarkerDebugHelpers(anchor.group);
        }

        anchor.onTargetFound = () => {
            console.log('MindARController: sticker detectado');
            this.tEncontrado = performance.now();
            activo = true;
            primera = true;
            if (content) content.visible = true;

            // El video arranca después de un momento, para que se alcance a ver el halo y los ojos encendiéndose.
            // Si el video ya venía a la mitad (se perdió el sticker un instante), continúa de una.
            clearTimeout(this.timerVideo);
            const asset = player.assets?.videos?.find((v) => v.name === 'dragon');
            const alInicio = !asset || asset.video.currentTime < 0.1;
            const arrancar = () => {
                if (planoDragon) planoDragon.visible = true;
                if (it.onFound) it.onFound.call(it);
            };
            if (alInicio && RETRASO_VIDEO > 0) {
                if (planoDragon) planoDragon.visible = false;
                this.timerVideo = setTimeout(arrancar, RETRASO_VIDEO * 1000);
            } else {
                arrancar();
            }

            this.dispatch('found', it);
        };

        anchor.onTargetLost = () => {
            console.log('MindARController: sticker perdido');
            clearTimeout(this.timerVideo);
            activo = false;
            if (content) content.visible = false;
            if (it.onLost) it.onLost.call(it);
            this.dispatch('lost', it);
        };

        this.anchors.push(anchor);

        this.copyEnvironment(scene, player);
        this.copyLights(scene, player);
        this.copyRendererSettings(renderer, player);

        // El player sigue corriendo (events update) pero deja de pintar.
        if (player?.setRenderEnabled) player.setRenderEnabled(false);

        try {
            await this.mindar.start();
        } catch (e) {
            this.mindar = null;
            this.started = false;
            const detail = (e && e.message) ? `: ${e.message}` : '. Comprobá que la cámara esté disponible y permitas el acceso';
            throw new Error(`No se pudo iniciar la cámara AR${detail}`);
        }

        renderer.setAnimationLoop(() => {
            const ahora = performance.now();
            const dt = Math.min(0.1, (ahora - ultimo) / 1000);
            ultimo = ahora;

            if (activo) {
                anchor.group.matrix.decompose(posObj, quatObj, escObj);
                if (primera) {
                    suavizado.position.copy(posObj);
                    suavizado.quaternion.copy(quatObj);
                    suavizado.scale.copy(escObj);
                    primera = false;
                } else {
                    const k = 1 - Math.exp(-dt / SUAVIDAD);
                    suavizado.position.lerp(posObj, k);
                    suavizado.quaternion.slerp(quatObj, k);
                    suavizado.scale.lerp(escObj, k);
                }
            }

            this.animarNubes(ahora / 1000);
            this.animarBruma(ahora / 1000);
            this.animarOjos(ahora / 1000);
            this.animarHalo(ahora / 1000);
            this.dispatch('update', {});
            renderer.render(scene, camera);
        });

        this.started = true;
        this.dispatch('start', {});
    }

    // Crea los planos de las nubes con sus imágenes transparentes
    crearNubes(content) {
        this.nubes = [];
        const loader = new THREE.TextureLoader();
        NUBES.forEach((n, i) => {
            const material = new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0,
                depthTest: false,
                depthWrite: false,
                toneMapped: false,
                side: THREE.DoubleSide,
            });
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
            mesh.renderOrder = n.atras ? 1 : 3; // 1 = detrás del dragón, 2 = dragón, 3 = delante
            mesh.visible = false;
            content.add(mesh);
            loader.load(n.archivo, (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace;
                material.map = tex;
                material.needsUpdate = true;
                const proporcion = tex.image.height / tex.image.width;
                mesh.userData.base = new THREE.Vector3(n.ancho, n.ancho * proporcion, 1);
                mesh.scale.copy(mesh.userData.base);
                mesh.visible = true;
            });
            this.nubes.push({ mesh, material, cfg: n, fase: i * 1.7 });
        });
    }

    // Las nubes aparecen con el video (cada una a su tiempo), se mecen y se desvanecen al final
    animarNubes(t) {
        if (!this.nubes || !this.nubes.length) return;
        const asset = this.threePlayer?.assets?.videos?.find((v) => v.name === 'dragon');
        const video = asset ? asset.video : null;
        const vt = video ? video.currentTime : 0;
        const dur = video && video.duration ? video.duration : 8;
        const suave = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };

        for (const n of this.nubes) {
            const c = n.cfg;
            const entra = suave((vt - c.entra) / 1.2);
            const sale = suave((dur - 0.3 - vt) / 1.0);
            const visible = Math.min(entra, sale);
            n.material.opacity = visible * 0.95;
            const x = c.x + Math.sin(t * c.vel + n.fase) * c.deriva + (1 - entra) * c.lado * 0.4;
            const y = SUBIR + c.y + Math.sin(t * c.vel * 0.7 + n.fase) * 0.04;
            n.mesh.position.set(x, y, c.atras ? 0.01 : 0.03);
            const base = n.mesh.userData.base;
            if (base) n.mesh.scale.set(base.x * (0.9 + 0.1 * visible), base.y * (0.9 + 0.1 * visible), 1);
        }
    }

    // Pone el video más lento
    ajustarVelocidad(player) {
        const asset = player?.assets?.videos?.find((v) => v.name === 'dragon');
        if (!asset) return;
        asset.video.defaultPlaybackRate = VELOCIDAD_VIDEO;
        asset.video.playbackRate = VELOCIDAD_VIDEO;
    }

    // Hace el dragón un poco transparente, más claro, y con la base desvanecida
    volverEtereo(dragon) {
        const m = dragon.material;
        if (!m || !m.isShaderMaterial) return;
        m.uniforms.opacidad = { value: OPACIDAD_DRAGON };
        m.uniforms.brillo = { value: BRILLO_DRAGON };
        m.uniforms.fundido = { value: FUNDIDO_BASE };
        let fs = m.fragmentShader;
        fs = fs.replace('uniform float smoothness;', 'uniform float smoothness;\n        uniform float opacidad;\n        uniform float brillo;\n        uniform float fundido;');
        fs = fs.replace(/vec4\(\s*color\.rgb,/, 'vec4(mix(color.rgb, vec3(0.88, 0.94, 1.0), brillo),');
        fs = fs.replace(/color\.a \* alpha/, 'color.a * alpha * opacidad * smoothstep(0.0, max(fundido, 0.001), vUv.y)');
        m.fragmentShader = fs;
        m.needsUpdate = true;
    }

    // Textura de neblina: un círculo suave blanco azulado que se desvanece hacia los bordes
    texturaBruma() {
        const c = document.createElement('canvas');
        c.width = c.height = 256;
        const g = c.getContext('2d');
        const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
        grad.addColorStop(0, 'rgba(165, 200, 255, 1)');
        grad.addColorStop(0.45, 'rgba(150, 190, 250, 0.6)');
        grad.addColorStop(1, 'rgba(140, 180, 245, 0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, 256, 256);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    crearBruma(content) {
        this.bruma = [];
        if (!BRUMA.length) return;
        const tex = this.texturaBruma();
        BRUMA.forEach((b, i) => {
            const material = new THREE.MeshBasicMaterial({
                map: tex,
                transparent: true,
                opacity: 0,
                depthTest: false,
                depthWrite: false,
                toneMapped: false,
            });
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
            mesh.scale.set(b.ancho, b.alto, 1);
            mesh.renderOrder = b.atras ? 0 : 4;
            content.add(mesh);
            this.bruma.push({ mesh, material, cfg: b, fase: i * 2.3 });
        });
    }

    // La neblina aparece con el video, respira suave y se va moviendo despacio
    animarBruma(t) {
        if (!this.bruma || !this.bruma.length) return;
        const asset = this.threePlayer?.assets?.videos?.find((v) => v.name === 'dragon');
        const video = asset ? asset.video : null;
        const vt = video ? video.currentTime : 0;
        const dur = video && video.duration ? video.duration : 8;
        const suave = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
        const visible = Math.min(suave(vt / 1.0), suave((dur - 0.2 - vt) / 1.0));

        for (const n of this.bruma) {
            const b = n.cfg;
            const respira = 0.8 + 0.2 * Math.sin(t * b.vel * 1.3 + n.fase);
            n.material.opacity = b.op * visible * respira;
            n.mesh.position.set(
                b.x + Math.sin(t * b.vel + n.fase) * b.deriva,
                SUBIR + b.y + Math.sin(t * b.vel * 0.6 + n.fase) * 0.05,
                b.atras ? 0.005 : 0.035
            );
            n.mesh.rotation.z = Math.sin(t * b.vel * 0.5 + n.fase) * 0.12;
        }
    }

    // Textura de brillo: círculo blanco con el centro intenso que se desvanece hacia afuera
    texturaBrillo() {
        const c = document.createElement('canvas');
        c.width = c.height = 128;
        const g = c.getContext('2d');
        const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.25, 'rgba(255, 255, 255, 0.85)');
        grad.addColorStop(0.6, 'rgba(255, 255, 255, 0.25)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, 128, 128);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    // Brillos de los ojos: los del sticker (celestes) y los del video (blancos, solo cuando ruge)
    crearOjos(content) {
        const tex = this.texturaBrillo();
        const crear = (color, tam, orden) => {
            const material = new THREE.MeshBasicMaterial({
                map: tex,
                color,
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending,
                depthTest: false,
                depthWrite: false,
                toneMapped: false,
            });
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
            mesh.scale.set(tam, tam, 1);
            mesh.renderOrder = orden;
            content.add(mesh);
            return { mesh, material };
        };

        // Ojos del sticker: van debajo del video del dragón
        this.ojosSticker = OJOS_STICKER.map((o) => {
            const g = crear(COLOR_OJOS_STICKER, o.tam, 0.5);
            g.mesh.position.set(o.x / STICKER_PX_ANCHO - 0.5, (0.5 - o.y / STICKER_PX_ALTO) * ALTO_STICKER, 0.005);
            return g;
        });

        // Ojos del dragón del video: van encima de todo
        this.ojosRugido = [crear(0xffffff, TAM_OJOS_RUGIDO, 5), crear(0xffffff, TAM_OJOS_RUGIDO, 5)];
    }

    animarOjos(t) {
        const suave = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };

        // 1) Al detectar el sticker se encienden los ojos del dragón del sticker y quedan latiendo suave
        if (this.ojosSticker && this.ojosSticker.length) {
            const desde = this.tEncontrado ? (performance.now() - this.tEncontrado) / 1000 : 0;
            const entra = suave(desde / 0.9);
            const destello = Math.exp(-desde * 2.5) * 0.5; // un destello fuerte al detectar
            const pulso = 0.75 + 0.25 * Math.sin(t * 2.6);
            const op = Math.min(1, INTENSIDAD_OJOS_STICKER * entra * pulso + destello);
            for (const g of this.ojosSticker) g.material.opacity = op;
        }

        // 2) Cuando el dragón del video ruge, sus ojos brillan en blanco
        if (this.ojosRugido) {
            const asset = this.threePlayer?.assets?.videos?.find((v) => v.name === 'dragon');
            const video = asset ? asset.video : null;
            const vt = video ? video.currentTime : 0;
            const sube = suave((vt - RUGIDO_INICIO) / 0.3);
            const baja = 1 - suave((vt - (RUGIDO_FIN - 0.4)) / 0.4);
            const fuerza = Math.min(sube, baja) * INTENSIDAD_RUGIDO;
            if (fuerza <= 0.001) {
                for (const g of this.ojosRugido) g.material.opacity = 0;
            } else {
                // posición de los ojos en el video, entre los cuadros anotados
                let i = 0;
                while (i < OJOS_RUGIDO.length - 2 && vt > OJOS_RUGIDO[i + 1][0]) i++;
                const A = OJOS_RUGIDO[i];
                const B = OJOS_RUGIDO[i + 1];
                const k = Math.min(1, Math.max(0, (vt - A[0]) / (B[0] - A[0])));
                const lerp = (a, b) => a + (b - a) * k;
                const pos = (px, py) => [
                    (px / 720 - 0.5) * ANCHO_VIDEO,
                    SUBIR + ALTO_VIDEO * (1 - py / 1280),
                ];
                const izq = pos(lerp(A[1], B[1]), lerp(A[2], B[2]));
                const der = pos(lerp(A[3], B[3]), lerp(A[4], B[4]));
                const parpadeo = 0.92 + 0.08 * Math.sin(t * 18);
                this.ojosRugido[0].mesh.position.set(izq[0], izq[1], 0.04);
                this.ojosRugido[1].mesh.position.set(der[0], der[1], 0.04);
                for (const g of this.ojosRugido) g.material.opacity = Math.min(1, fuerza * parpadeo);
            }
        }
    }

    // Halo fino de luz que bordea al dragón del sticker. Es una imagen del mismo tamaño que el sticker
    crearHalo(content) {
        const material = new THREE.MeshBasicMaterial({
            color: COLOR_HALO,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            depthWrite: false,
            toneMapped: false,
        });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, ALTO_STICKER), material);
        mesh.position.set(0, 0, 0.003);
        mesh.renderOrder = 0.4; // debajo del video del dragón
        content.add(mesh);
        this.halo = { mesh, material };
        new THREE.TextureLoader().load('assets/img/halo-dragon.png', (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            material.map = tex;
            material.needsUpdate = true;
        });
    }

    // Se enciende al detectar el sticker y queda latiendo suave
    animarHalo(t) {
        if (!this.halo) return;
        const suave = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
        const desde = this.tEncontrado ? (performance.now() - this.tEncontrado) / 1000 : 0;
        const entra = suave(desde / 1.0);
        const pulso = 0.7 + 0.3 * Math.sin(t * 2.0);
        const destello = Math.exp(-desde * 2.5) * 0.4;
        this.halo.material.opacity = Math.min(1, INTENSIDAD_HALO * entra * pulso + destello);
    }

    stop() {
        if (!this.mindar) return;
        if (this.mindar.renderer?.setAnimationLoop) {
            this.mindar.renderer.setAnimationLoop(null);
        }
        this.mindar.stop();
        this.mindar = null;
        this.started = false;
    }

    switchCamera() {
        this.mindar?.switchCamera();
    }

    copyEnvironment(scene, player) {
        const appScene = player?.scene;
        if (!appScene) return;

        if (appScene.environment) {
            scene.environment = appScene.environment;
        }
        if (appScene.environmentIntensity !== undefined) {
            scene.environmentIntensity = appScene.environmentIntensity;
        }
        if (appScene.environmentRotation) {
            scene.environmentRotation.copy(appScene.environmentRotation);
        }
    }

    copyLights(scene, player) {
        const appScene = player?.scene;
        if (!appScene) return;

        appScene.traverse((obj) => {
            if (obj.isLight && obj !== appScene) {
                scene.add(obj.clone());
            }
        });
    }

    copyRendererSettings(renderer, player) {
        const appRenderer = player?.renderer;
        if (!appRenderer || !renderer) return;

        renderer.toneMapping = appRenderer.toneMapping;
        renderer.toneMappingExposure = appRenderer.toneMappingExposure;
        renderer.shadowMap.enabled = appRenderer.shadowMap?.enabled === true && !this.isMobile;
        renderer.shadowMap.type = appRenderer.shadowMap?.type ?? THREE.PCFShadowMap;
    }

    // Con ?debug=1 se ve un recuadro azul sobre el sticker para comprobar que lo detecta bien
    addMarkerDebugHelpers(root) {
        const planeGeometry = new THREE.PlaneGeometry(1, ALTO_STICKER, 1, 1);
        const planeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide,
            depthWrite: false,
        });

        root.add(new THREE.Mesh(planeGeometry, planeMaterial));
        root.add(new THREE.LineSegments(
            new THREE.EdgesGeometry(planeGeometry),
            new THREE.LineBasicMaterial({ color: 0x00ffff })
        ));
        root.add(new THREE.AxesHelper(0.3));
    }

}

export { MindARController };
