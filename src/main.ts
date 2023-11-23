import * as THREE from 'three';

import Stats from 'three/examples/jsm/libs/stats.module';

//  python python_server/superresolution.py
//  npx vite

let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let cube: THREE.Mesh;
let cube_2: THREE.Mesh;
let cube_3: THREE.Mesh;
let mesh_shader: THREE.Mesh;
let stats: Stats;
let vertexShader: string;
let customMatrix: THREE.Matrix4;
let rotationAngle = 0;

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let intervaloVerificacion = null;
var pos_siguiente_figura = 0;
let selectedObject = null;
var actual_Texture = null;
var saved_texture = null;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
var lista_cubos = [];
var lista_esferas = [];

function init() {
  // Setup stats 
  stats = new Stats();
  document.body.appendChild(stats.dom);

  // Setup renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(drawLoop);
  document.body.appendChild(renderer.domElement);

  // Setup Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(THREE.Color.NAMES['gray']);

  // Setup Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;
  scene.add(camera);
  
  // Setup Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.update();


  //setup python code
  /*
  fetch('textures/texture_santiago.jpg')
  .then(response => response.blob())
  .then(blob => {
    const formData = new FormData();
    formData.append('imagen', blob, 'texture_santigo.jpg');

    fetch('http://127.0.0.1:5000/procesar_imagen', {
      
      method: 'POST',
      body: formData
    })
  })
  .catch(error => {
    console.log("errorrr");
  });*/

  /*const geometry = new THREE.BoxGeometry(1, 1, 1);
  const texture_cube = new THREE.TextureLoader().load('textures/texture_santiago.jpg');
  const material2 = new THREE.MeshPhongMaterial({ map: texture_cube });
  cube = new THREE.Mesh(geometry, material2);
  cube.position.x = 0;
  cube.scale.x = 3;
  cube.scale.y = 3;
  cube.scale.z = 3;
  scene.add(cube);*/

  //setup texture change

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'fileInput';
    fileInput.accept = '.jpg, .jpeg, .png';
    fileInput.style.display = 'hidden';
    document.body.appendChild(fileInput);
    
    const applyTextureBtn = document.getElementById('applyTextureBtn');
    applyTextureBtn.style.position = 'absolute'; 
    applyTextureBtn.style.top = '0px'; 
    applyTextureBtn.style.left = '90px';
    applyTextureBtn.addEventListener('click', function() {
      console.log("Botón 'Aplicar Textura' clicado"); 
      fileInput.click(); 
      fileInput.addEventListener('change', function(event) {
        lista_cubos = [];
        lista_esferas = [];
        //delete all cubes
        for (var i = scene.children.length - 1; i >= 0; i--) {
          if (scene.children[i].type == "Mesh") {
            scene.remove(scene.children[i]);
          }
        }
    
        console.log("Archivo seleccionado"); 
        const inputElement = event.target as HTMLInputElement; 
        const file = inputElement.files[0]; 
        if (file) {
          
          const nombreArchivoAVerificar = "FSRCNN_3_"+file.name;
          verificarCadaSegundo(nombreArchivoAVerificar,file.name);
          //imprimir ruta del archivo
          console.log(file.name);
          const reader = new FileReader();
  
          reader.onload = function(e) {
            const textureData = e.target.result; 
            //console.log(textureData); 
            // Aplicar la textura a tu cubo
            actual_Texture = textureData;
            const cubo_con_textura = crearCuboConTextura(textureData);
            cubo_con_textura.position.x = 0;
            const esfera_con_textura = crearEsferaConTextura(textureData);
            esfera_con_textura.position.x = 0;
            lista_esferas.push(esfera_con_textura);
            lista_cubos.push(cubo_con_textura);
            //scene.add(esfera_con_textura);
            scene.add(cubo_con_textura);
            pos_siguiente_figura = 4;
            //pasar nombre de imagen a python
            fetch('textures/'+file.name)
            .then(response => response.blob())
            .then(blob => {
              const formData = new FormData();
              formData.append('imagen', blob, file.name);
          
              fetch('http://127.0.0.1:5000/procesar_imagen', {
                  
                  method: 'POST',
                  body: formData
                })
              }
            )
          };
  
          reader.readAsDataURL(file); // Leer el archivo como datos URL base64
        }
      });
    });

    const esferas_button = document.getElementById('esferas_button');
    esferas_button.style.position = 'absolute';
    esferas_button.style.top = '0px';
    esferas_button.style.left = '195px';
    //listener para esferas
    esferas_button.addEventListener('click', function() {
      console.log("Botón 'Esferas' clicado");
      //hide cubes saved in list
      for (var i = 0; i < lista_cubos.length; i++) {
        scene.remove(lista_cubos[i]);
      }
      //show spheres saved in list
      for (var i = 0; i < lista_esferas.length; i++) {
        scene.add(lista_esferas[i]);
      }
      window.addEventListener('mousedown', onMouseDown, false);
      window.addEventListener('mouseup', onMouseUp, false);
    });

    const cubos_button = document.getElementById('cubos_button');
    cubos_button.style.position = 'absolute';
    cubos_button.style.top = '0px';
    cubos_button.style.left = '257px';
    //listener para cubos
    cubos_button.addEventListener('click', function() {
      console.log("Botón 'Cubos' clicado");
      //hide spheres saved in list
      for (var i = 0; i < lista_esferas.length; i++) {
        scene.remove(lista_esferas[i]);
      }
      //show cubes saved in list
      for (var i = 0; i < lista_cubos.length; i++) {
        scene.add(lista_cubos[i]);
      }
      window.addEventListener('mousedown', onMouseDown, false);
      window.addEventListener('mouseup', onMouseUp, false);
    });

  



  //setup light
  //poner luz blanca ambiental que sea igual en todos los lados
  const light = new THREE.AmbientLight(0xffffff, 1);
  scene.add(light);





  window.addEventListener('resize', onWindowResize, false);
}

function crearCuboConTextura(pathTextura) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load(pathTextura) });
  const cube = new THREE.Mesh(geometry, material);
  //scale 4
  cube.scale.x = 3;
  cube.scale.y = 3;
  cube.scale.z = 3;
  cube.position.x = pos_siguiente_figura;
  pos_siguiente_figura = pos_siguiente_figura + 4;
  return cube;
}
function crearEsferaConTextura(pathTextura) {
  const geometry = new THREE.SphereGeometry( 1, 32, 32 );
  const material = new THREE.MeshBasicMaterial( { map: new THREE.TextureLoader().load(pathTextura) } );
  const sphere = new THREE.Mesh( geometry, material );
  sphere.scale.x = 2;
  sphere.scale.y = 2;
  sphere.scale.z = 2;
  sphere.position.x = pos_siguiente_figura;
  //pos_siguiente_figura = pos_siguiente_figura + 4;
  return sphere;
}

function cambiarTextura(objeto, nuevaTextura) {
  objeto.material.map = new THREE.TextureLoader().load(nuevaTextura);
}

//let intervaloVerificacion: ReturnType<typeof setInterval> | null = null;

function verificarArchivo(nombreArchivo: string, archivoOriginal: string): void {
  const rutaArchivo = `textures/superresolution_textures/${nombreArchivo}`;
  const redes = ["FSRCNN_1_","FSRCNN_2_", "FSRCNN_3_"]
  // Verificar si el archivo existe haciendo una solicitud HEAD
  fetch(rutaArchivo, { method: 'HEAD' })
    .then(response => {
      if (response.ok) {
        //hacer un for con la lista redes
        for (var i = 0; i < redes.length; i++) {
          const texture_name= redes[i]+archivoOriginal;
          const texture_path = `textures/superresolution_textures/${texture_name}`;
          const esfera_textura= crearEsferaConTextura(texture_path);
          const cubo_textura= crearCuboConTextura(texture_path);
          
          lista_cubos.push(cubo_textura);
          lista_esferas.push(esfera_textura);
          //scene.add(esfera_textura);
          scene.add(cubo_textura);
          console.log("Adicionado cubo con textura: "+texture_name)
        }
        console.log(`¡El archivo ${nombreArchivo} existe en la carpeta 'superresolution_textures'!`);
      
        detenerVerificacionAnterior();

      } else {
        console.log(`El archivo ${nombreArchivo} no existe en la carpeta 'superresolution_textures'.`);
      }
    })
    .catch(error => {
      console.error('Error al verificar el archivo:', error);
    });
}

function detenerVerificacionAnterior(): void {
  if (intervaloVerificacion !== null) {
    clearInterval(intervaloVerificacion);
    intervaloVerificacion = null;
  }
}

function verificarCadaSegundo(nombreArchivo: string, archivoOriginal: string): void {
  detenerVerificacionAnterior(); // Detiene la verificación anterior antes de comenzar una nueva
  intervaloVerificacion = setInterval(() => {
    verificarArchivo(nombreArchivo, archivoOriginal);
  }, 2500); // Verificar cada 5 segundos
}


function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function drawLoop() {
  stats.update();
  rotationAngle =0.001;
  const rotationMatrix = new THREE.Matrix4().makeRotationY(rotationAngle);
  //cube.applyMatrix4(rotationMatrix);
  //cube.updateMatrixWorld();

  renderer.render(scene, camera);
}

function onMouseDown(event) {
  event.preventDefault();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children);

  if (intersects.length > 0) {
    selectedObject = intersects[0].object;

    // Cambiar la textura al hacer clic
    saved_texture = selectedObject.material.map;
    selectedObject.material.map = new THREE.TextureLoader().load(actual_Texture);
  }
}

function onMouseUp() {
  if (selectedObject) {
    // Restaurar la textura original al soltar el clic
    selectedObject.material.map = saved_texture;
    selectedObject = null;
  }
}

window.addEventListener('mousedown', onMouseDown, false);
window.addEventListener('mouseup', onMouseUp, false);


init();
