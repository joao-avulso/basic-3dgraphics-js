let canvas = document.getElementById('viewport');
let ctx = canvas.getContext('2d');

const larguraTela = canvas.width;
const alturaTela = canvas.height;
const origemTela = { x: canvas.width / 2, y: canvas.height / 2 };

let tempoDecorrido = 0.0;

////////////////////////// CLASSES //////////////////////////

// define um ponto no espaço 3D
class Vec3d {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

// define um triângulo constituido de pontos no espaço 3D
class Triangulo {
  constructor(p1, p2, p3) {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
  }
}

// define um modelo 3D constituido de triângulos
class Modelo {
  constructor() {
    this.triangulos = [];
  }
}

////////////////////////// INICIALIZAÇÃO //////////////////////////

function InitViewport(params) {
  console.log('InitViewport');

  let fPerto = 0.1; // plano mais próximo
  let fLonge = 1000.0; // plano mais distante
  let fCdv = 90.0; // campo de visão
  let fAspecto = larguraTela / alturaTela; // razão de aspecto
  let fCdvRad = 1.0 / Math.tan((fCdv * 0.01) / (180.0 * Math.PI)); // campo de visão em radianos

  // matriz de projeção
  let matrizProj = [
    [fAspecto * fCdvRad, 0, 0, 0],
    [0, fCdvRad, 0, 0],
    [0, 0, fLonge / (fLonge - fPerto), 1],
    [0, 0, (-fLonge * fPerto) / (fLonge - fPerto), 0],
  ];

  // cria um cubo
  let cubo = new Modelo();
  cubo.triangulos = [
    //FACES
    //SUL
    new Triangulo(new Vec3d(0, 0, 0), new Vec3d(0, 1, 0), new Vec3d(1, 1, 0)),
    new Triangulo(new Vec3d(0, 0, 0), new Vec3d(1, 1, 0), new Vec3d(1, 0, 0)),
    //LESTE
    new Triangulo(new Vec3d(1, 0, 0), new Vec3d(1, 1, 0), new Vec3d(1, 1, 1)),
    new Triangulo(new Vec3d(1, 0, 0), new Vec3d(1, 1, 1), new Vec3d(1, 0, 1)),
    //NORTE
    new Triangulo(new Vec3d(1, 0, 1), new Vec3d(1, 1, 1), new Vec3d(0, 1, 1)),
    new Triangulo(new Vec3d(1, 0, 1), new Vec3d(0, 1, 1), new Vec3d(0, 0, 1)),
    //OESTE
    new Triangulo(new Vec3d(0, 0, 1), new Vec3d(0, 1, 1), new Vec3d(0, 1, 0)),
    new Triangulo(new Vec3d(0, 0, 1), new Vec3d(0, 1, 0), new Vec3d(0, 0, 0)),
    //TOPO
    new Triangulo(new Vec3d(0, 1, 0), new Vec3d(0, 1, 1), new Vec3d(1, 1, 1)),
    new Triangulo(new Vec3d(0, 1, 0), new Vec3d(1, 1, 1), new Vec3d(1, 1, 0)),
    //FUNDO
    new Triangulo(new Vec3d(1, 0, 1), new Vec3d(0, 0, 1), new Vec3d(0, 0, 0)),
    new Triangulo(new Vec3d(1, 0, 1), new Vec3d(0, 0, 0), new Vec3d(1, 0, 0)),
  ];

  transladarModelo(cubo, 0, -0.5, 0);

  // loop de renderização
  let tInicio = Date.now();
  let fTheta = 0;
  setInterval(() => {
    fTheta += tempoDecorrido * 0.001;
    limpaTela();
    ctx.strokeStyle = 'white';
    rotacionarY(cubo, 0.3 * tempoDecorrido * 0.001);
    desenhaModelo(cubo, matrizProj);
    tempoDecorrido = Date.now() - tInicio;
    document.getElementById('frame time').innerHTML = tempoDecorrido + 'ms';
    tInicio = Date.now();
  }, 1000 / 60);
}

////////////////////////// RENDER //////////////////////////

// limpa a tela do viewport
function limpaTela() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, larguraTela, alturaTela);
}

function desenhaModelo(modelo, matrizProj) {
  modelo.triangulos.forEach((triangulo) => {
    desenhaTriangulo(triangulo, matrizProj);
  });
}

function desenhaTriangulo(triangulo, matrizProj) {
  triangulo.p1.z += 3;
  triangulo.p2.z += 3;
  triangulo.p3.z += 3;

  // projetar triângulo para viewport
  let p1Projetado = multiplicaMatrizPorVec3d(matrizProj, triangulo.p1);
  let p2Projetado = multiplicaMatrizPorVec3d(matrizProj, triangulo.p2);
  let p3Projetado = multiplicaMatrizPorVec3d(matrizProj, triangulo.p3);

  triangulo.p1.z -= 3;
  triangulo.p2.z -= 3;
  triangulo.p3.z -= 3;

  // aumentar para tela
  p1Projetado.x += 1 * origemTela.x;
  p1Projetado.y += 1 * origemTela.y;
  p2Projetado.x += 1 * origemTela.x;
  p2Projetado.y += 1 * origemTela.y;
  p3Projetado.x += 1 * origemTela.x;
  p3Projetado.y += 1 * origemTela.y;

  // desenha triângulo
  ctx.beginPath();
  ctx.moveTo(p1Projetado.x, p1Projetado.y);
  ctx.lineTo(p2Projetado.x, p2Projetado.y);
  ctx.lineTo(p3Projetado.x, p3Projetado.y);
  ctx.lineTo(p1Projetado.x, p1Projetado.y);
  ctx.stroke();
}

////////////////////////// TRANSFORMAÇÕES //////////////////////////

function transladarModelo(modelo, x, y, z) {
  modelo.triangulos.forEach((triangulo) => {
    triangulo.p1.x += x;
    triangulo.p1.y += y;
    triangulo.p1.z += z;
    triangulo.p2.x += x;
    triangulo.p2.y += y;
    triangulo.p2.z += z;
    triangulo.p3.x += x;
    triangulo.p3.y += y;
    triangulo.p3.z += z;
  });
}

// rotacionar modelo
function rotacionarX(modelo, angulo) {
  matrizRotX = [
    [1, 0, 0, 0],
    [0, Math.cos(angulo), -Math.sin(angulo), 0],
    [0, Math.sin(angulo), Math.cos(angulo), 0],
    [0, 0, 0, 1],
  ];

  modelo.triangulos.forEach((triangulo) => {
    triangulo.p1 = multiplicaMatrizPorVec3d(matrizRotX, triangulo.p1);
    triangulo.p2 = multiplicaMatrizPorVec3d(matrizRotX, triangulo.p2);
    triangulo.p3 = multiplicaMatrizPorVec3d(matrizRotX, triangulo.p3);
  });
}

function rotacionarY(modelo, angulo) {
  matrizRotY = [
    [Math.cos(angulo), 0, Math.sin(angulo), 0],
    [0, 1, 0, 0],
    [-Math.sin(angulo), 0, Math.cos(angulo), 0],
    [0, 0, 0, 1],
  ];

  modelo.triangulos.forEach((triangulo) => {
    triangulo.p1 = multiplicaMatrizPorVec3d(matrizRotY, triangulo.p1);
    triangulo.p2 = multiplicaMatrizPorVec3d(matrizRotY, triangulo.p2);
    triangulo.p3 = multiplicaMatrizPorVec3d(matrizRotY, triangulo.p3);
  });
}

function rotacionarZ(modelo, angulo) {
  matrizRotZ = [
    [Math.cos(angulo), -Math.sin(angulo), 0, 0],
    [Math.sin(angulo), Math.cos(angulo), 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];

  modelo.triangulos.forEach((triangulo) => {
    triangulo.p1 = multiplicaMatrizPorVec3d(matrizRotZ, triangulo.p1);
    triangulo.p2 = multiplicaMatrizPorVec3d(matrizRotZ, triangulo.p2);
    triangulo.p3 = multiplicaMatrizPorVec3d(matrizRotZ, triangulo.p3);
  });
}

// escalar modelo em todas as dimensões
function escalonarModelo(modelo, escala) {
  modelo.triangulos.forEach((triangulo) => {
    triangulo.p1.x *= escala;
    triangulo.p1.y *= escala;
    triangulo.p1.z *= escala;
    triangulo.p2.x *= escala;
    triangulo.p2.y *= escala;
    triangulo.p2.z *= escala;
    triangulo.p3.x *= escala;
    triangulo.p3.y *= escala;
    triangulo.p3.z *= escala;
  });
}

////////////////////////// MATEMATICA //////////////////////////

// multiplica matriz4x4 por vec3d
function multiplicaMatrizPorVec3d(matriz, vec3d) {
  let x =
    vec3d.x * matriz[0][0] +
    vec3d.y * matriz[1][0] +
    vec3d.z * matriz[2][0] +
    matriz[3][0];
  let y =
    vec3d.x * matriz[0][1] +
    vec3d.y * matriz[1][1] +
    vec3d.z * matriz[2][1] +
    matriz[3][1];
  let z =
    vec3d.x * matriz[0][2] +
    vec3d.y * matriz[1][2] +
    vec3d.z * matriz[2][2] +
    matriz[3][2];
  let w =
    vec3d.x * matriz[0][3] +
    vec3d.y * matriz[1][3] +
    vec3d.z * matriz[2][3] +
    matriz[3][3];

  if (w != 0) {
    x /= w;
    y /= w;
    z /= w;
  }

  return new Vec3d(x, y, z);
}
