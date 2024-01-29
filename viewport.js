let canvas = document.getElementById('viewport');
let ctx = canvas.getContext('2d');

canvas.width = window.innerWidth - 18;

const larguraTela = canvas.width;
const alturaTela = canvas.height;
const origemTela = { x: canvas.width / 2, y: canvas.height / 2 };

////////////////////////// CLASSES //////////////////////////

// define um ponto no espaço 3D
class Vec3d {
  constructor(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w ? w : 1;
  }

  matriz() {
    return [[this.x], [this.y], [this.z], [this.w]];
  }

  static adicao(v1, v2) {
    return new Vec3d(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
  }

  static subtracao(v1, v2) {
    return new Vec3d(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
  }

  static multiplicacao(v1, escalar) {
    return new Vec3d(v1.x * escalar, v1.y * escalar, v1.z * escalar);
  }

  static produtoVetorial(v1, v2) {
    return new Vec3d(
      v1.y * v2.z - v1.z * v2.y,
      v1.z * v2.x - v1.x * v2.z,
      v1.x * v2.y - v1.y * v2.x
    );
  }

  static produtoEscalar(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  }

  static normalizacao(v1) {
    let modulo = Math.sqrt(Vec3d.produtoEscalar(v1, v1));
    return new Vec3d(v1.x / modulo, v1.y / modulo, v1.z / modulo);
  }

  static multMatrizVec(m, i) {
    let v = new Vec3d(0, 0, 0, 0);
    v.x = i.x * m[0][0] + i.y * m[1][0] + i.z * m[2][0] + i.w * m[3][0];
    v.y = i.x * m[0][1] + i.y * m[1][1] + i.z * m[2][1] + i.w * m[3][1];
    v.z = i.x * m[0][2] + i.y * m[1][2] + i.z * m[2][2] + i.w * m[3][2];
    v.w = i.x * m[0][3] + i.y * m[1][3] + i.z * m[2][3] + i.w * m[3][3];

    if (Math.abs(v.w) > Number.EPSILON) {
      v.x /= v.w;
      v.y /= v.w;
      v.z /= v.w;
    }
    return v;
  }
}

// define um poligono com vertices
class Poligono {
  constructor(vertices) {
    this.vertices = vertices ? vertices : [];
  }

  // calcula a normal do poligono
  normal() {
    let v1 = Vec3d.subtracao(this.vertices[1], this.vertices[0]);
    let v2 = Vec3d.subtracao(this.vertices[2], this.vertices[0]);
    let normal = Vec3d.produtoVetorial(v1, v2);
    return Vec3d.normalizacao(normal);
  }
}

// define um modelo 3D constituido de poligonos/faces
class Modelo {
  constructor() {
    this.poligonos = undefined;
  }
}

// métodos para criação de matrizes 4x4
class Matriz4x4 {
  // matriz identidade
  static identidade() {
    return [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
  }

  // matriz de projecao com valores de plano mais proximo,
  // plano mais distante e campo de visão
  static projecao(fPerto, fLonge, fCdv) {
    let escala = 1 / Math.tan(fCdv * 0.001 * (Math.PI / 180)); // escala
    // let fAspecto = larguraTela / alturaTela; // razão de aspecto
    return [
      [escala, 0, 0, 0],
      [0, escala, 0, 0],
      [0, 0, fLonge / (fLonge - fPerto), 1],
      [0, 0, -((fLonge * fPerto) / (fLonge - fPerto)), 0],
    ];
  }

  // rotação em volta de um eixo arbitrario
  static rotacaoEixo(angulo, eixo) {
    angulo = angulo * (Math.PI / 180);
    let c = Math.cos(angulo);
    let s = Math.sin(angulo);
    let t = 1 - c;
    let x = eixo.x;
    let y = eixo.y;
    let z = eixo.z;
    return [
      [t * x * x + c, t * x * y + z * s, t * x * z - y * s, 0],
      [t * x * y - z * s, t * y * y + c, t * y * z + x * s, 0],
      [t * x * z + y * s, t * y * z - x * s, t * z * z + c, 0],
      [0, 0, 0, 1],
    ];
  }
}

////////////////////////// INICIALIZAÇÃO //////////////////////////

// variaveis de tempo
let tFrame = 0.0;

//  cria um cubo com poligonos
let cuboP = new Modelo();
cuboP.poligonos = [
  // sul
  new Poligono([
    new Vec3d(-1, -1, -1),
    new Vec3d(-1, 1, -1),
    new Vec3d(1, 1, -1),
  ]),
  new Poligono([
    new Vec3d(-1, -1, -1),
    new Vec3d(1, 1, -1),
    new Vec3d(1, -1, -1),
  ]),

  // leste
  new Poligono([new Vec3d(1, -1, -1), new Vec3d(1, 1, -1), new Vec3d(1, 1, 1)]),
  new Poligono([new Vec3d(1, -1, -1), new Vec3d(1, 1, 1), new Vec3d(1, -1, 1)]),

  // norte
  new Poligono([new Vec3d(1, -1, 1), new Vec3d(1, 1, 1), new Vec3d(-1, 1, 1)]),
  new Poligono([
    new Vec3d(1, -1, 1),
    new Vec3d(-1, 1, 1),
    new Vec3d(-1, -1, 1),
  ]),

  // oeste
  new Poligono([
    new Vec3d(-1, -1, 1),
    new Vec3d(-1, 1, 1),
    new Vec3d(-1, 1, -1),
  ]),
  new Poligono([
    new Vec3d(-1, -1, 1),
    new Vec3d(-1, 1, -1),
    new Vec3d(-1, -1, -1),
  ]),

  // base
  new Poligono([new Vec3d(-1, 1, -1), new Vec3d(-1, 1, 1), new Vec3d(1, 1, 1)]),
  new Poligono([new Vec3d(-1, 1, -1), new Vec3d(1, 1, 1), new Vec3d(1, 1, -1)]),

  // topo
  new Poligono([
    new Vec3d(-1, -1, -1),
    new Vec3d(1, -1, 1),
    new Vec3d(-1, -1, 1),
  ]),
  new Poligono([
    new Vec3d(1, -1, -1),
    new Vec3d(1, -1, 1),
    new Vec3d(-1, -1, -1),
  ]),
];

// objeto a ser renderizado
let Obj = cuboP;
let escFaces = true;
let invNormais = 1;

// variaveis de câmera
let vecCamera = new Vec3d(0, 0, -5); // posição da camera
let vecDirVisao = new Vec3d(0, 0, 1); // direção da camera
let velocidadeCam = 20;
let movimentoCam = new Vec3d(0, 0, 0);
// let cRotY = 0.0; // graus de rotação da camera
// let rotYcam = 0.0; // escala de rotação da camera

// matriz camera
let vecCima = new Vec3d(0, 1, 0);
let vecAlvo = new Vec3d(0, 0, 1);
// let matRotacaoCam = Matriz4x4.rotacaoY(cRotY);
// vecDirVisao = Vec3d.multMatrizVec(matRotacaoCam, vecAlvo);
vecAlvo = Vec3d.adicao(vecCamera, vecDirVisao);
let matCamera = matrizApontarPara(vecCamera, vecAlvo, vecCima);
let matVisao = matrizInverterApontarPara(matCamera);

// criar matriz de projeção
let matrizProj = Matriz4x4.projecao(0.1, 1000.0, 90);

function InitViewport() {
  console.log('InitViewport');

  // loop de renderização
  let tInicio = Date.now();
  setInterval(() => {
    handle();
    update();
    render();

    // gerenciamento de tempo
    tFrame = Date.now() - tInicio;
    tInicio = Date.now();
    document.getElementById('frame time').innerHTML =
      Math.round(1000 / tFrame) + ' FPS';
  }, 1000 / 60);
}

////////////////////////// RENDER //////////////////////////

function render() {
  limpaTela();
  desenhaModelo(Obj);
}

// limpa a tela do viewport
function limpaTela() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, larguraTela, alturaTela);
}

function desenhaModelo(modelo) {
  ctx.strokeStyle = 'white';
  modelo.poligonos.forEach((poligono) => {
    desenhaPoligono(poligono, matrizProj, matVisao);
  });
}

// desenha na viewport um poligono de coordenadas 3D
function desenhaPoligono(poligono, matrizProj, matrizVisao) {
  let desenhar = true;

  // escolhe as faces que estão voltadas para a camera
  if (!escFaces) {
    // normal do poligono
    let normal = poligono.normal();

    // vetor do poligono para a camera
    let raioCam = Vec3d.subtracao(poligono.vertices[0], vecCamera);

    desenhar =
      Vec3d.produtoEscalar(normal, raioCam) * invNormais < 0 ? true : false;
  }

  if (desenhar) {
    // converter world space -> view space
    let vertsView = [];
    poligono.vertices.forEach((vertice) => {
      vertsView.push(Vec3d.multMatrizVec(matrizVisao, vertice));
    });

    // cria vetor de vértices projetados para viewport
    let vertsProj = [];
    vertsView.forEach((vertice) => {
      vertsProj.push(Vec3d.multMatrizVec(matrizProj, vertice));
    });

    // ajustar coordenadas de projeção ao centro da tela
    vertsProj.forEach((vert) => {
      vert.x += 1 * origemTela.x;
      vert.y += 1 * origemTela.y;
    });

    // desenhar linhas do poligono
    ctx.beginPath();
    ctx.moveTo(vertsProj[0].x, vertsProj[0].y);
    for (i = 1; i < vertsProj.length; i++) {
      ctx.lineTo(vertsProj[i].x, vertsProj[i].y);
    }
    ctx.lineTo(vertsProj[0].x, vertsProj[0].y);
    ctx.stroke();
  }
}

////////////////////////// TRANSFORMAÇÕES //////////////////////////

function update() {
  atualizaCam(vecCamera, movimentoCam, velocidadeCam);
  rotacionarModelo(Obj, 10 * tFrame * 0.001, new Vec3d(1, 1, 1));
}

// atualiza a posição e matriz de visao da camera
function atualizaCam() {
  vecCamera.x += movimentoCam.x * tFrame * 0.001;
  vecCamera.y += movimentoCam.y * tFrame * 0.001;
  vecCamera.z += movimentoCam.z * tFrame * 0.001;
  // cRotY += rotYcam * tempoDecorrido * 0.001;

  vecDirVisao = new Vec3d(0, 0, 1);
  vecCima = new Vec3d(0, 1, 0);
  vecAlvo = new Vec3d(0, 0, 1);
  // matRotacaoCam = Matriz4x4.rotacaoY(-cRotY);
  // vecDirVisao = Vec3d.multMatrizVec(matRotacaoCam, vecAlvo);
  vecAlvo = Vec3d.adicao(vecCamera, vecDirVisao);
  matCamera = matrizApontarPara(vecCamera, vecAlvo, vecCima);
  matVisao = matrizInverterApontarPara(matCamera);
}

// rotacionar modelo em torno de um eixo
// a escala do eixo define a quantidade de rotação
function rotacionarModelo(modelo, angulo, eixo) {
  modelo.poligonos.forEach((poligono) => {
    for (i = 0; i < poligono.vertices.length; i++) {
      poligono.vertices[i] = Vec3d.multMatrizVec(
        Matriz4x4.rotacaoEixo(angulo, eixo),
        poligono.vertices[i]
      );
    }
  });
}

// escalar modelo em todas as dimensões
function escalonarModelo(modelo, escala) {
  modelo.poligonos.forEach((poligono) => {
    poligono.vertices.forEach((vertice) => {
      vertice.x *= escala;
      vertice.y *= escala;
      vertice.z *= escala;
    });
  });
}

////////////////////////// MATEMATICA //////////////////////////

function matrizInverterApontarPara(mat) {
  let matriz = [
    [mat[0][0], mat[1][0], mat[2][0], 0],
    [mat[0][1], mat[1][1], mat[2][1], 0],
    [mat[0][2], mat[1][2], mat[2][2], 0],
    [
      -(mat[3][0] * mat[0][0] + mat[3][1] * mat[0][1] + mat[3][2] * mat[0][2]),
      -(mat[3][0] * mat[1][0] + mat[3][1] * mat[1][1] + mat[3][2] * mat[1][2]),
      -(mat[3][0] * mat[2][0] + mat[3][1] * mat[2][1] + mat[3][2] * mat[2][2]),
      1,
    ],
  ];

  return matriz;
}

function matrizApontarPara(origem, alvo, up) {
  // calcular novo vetor forward
  let newForward = Vec3d.subtracao(alvo, origem);
  newForward = Vec3d.normalizacao(newForward);

  // calcular novo vetor up
  let a = Vec3d.produtoEscalar(
    newForward,
    Vec3d.produtoVetorial(up, newForward)
  );
  let newUp = Vec3d.subtracao(
    up,
    new Vec3d(a * newForward.x, a * newForward.y, a * newForward.z)
  );
  newUp = Vec3d.normalizacao(newUp);

  let newRight = Vec3d.produtoVetorial(newUp, newForward);

  let matriz = [
    [newRight.x, newRight.y, newRight.z, 0],
    [newUp.x, newUp.y, newUp.z, 0],
    [newForward.x, newForward.y, newForward.z, 0],
    [origem.x, origem.y, origem.z, 1],
  ];

  return matriz;
}

////////////////////////// EVENTOS //////////////////////////

function inverterNormais() {
  invNormais *= -1;
}

function escolherFaces() {
  escFaces = !escFaces;
}

//eventos do teclado
function handle() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
      movimentoCam.y = -velocidadeCam;
    }
    if (e.key === 'ArrowDown') {
      movimentoCam.y = velocidadeCam;
    }
  });
  document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      movimentoCam.y = 0;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      movimentoCam.x = velocidadeCam;
    }
    if (e.key === 'ArrowLeft') {
      movimentoCam.x = -velocidadeCam;
    }
  });
  document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      movimentoCam.x = 0;
    }
  });

  let vecFrente = Vec3d.multiplicacao(vecDirVisao, velocidadeCam * 0.0001);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'w') {
      movimentoCam = Vec3d.adicao(movimentoCam, vecFrente);
    }
    if (e.key === 's') {
      movimentoCam = Vec3d.subtracao(movimentoCam, vecFrente);
    }
  });
  document.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 's') {
      movimentoCam = new Vec3d(0, 0, 0);
    }
  });

  // rotação da camera não funciona corretamente

  // document.addEventListener('keydown', (e) => {
  //   if (e.key === 'a') {
  //     rotYcam = velocidadeCam;
  //   }
  //   if (e.key === 'd') {
  //     rotYcam = -velocidadeCam;
  //   }
  // });
  // document.addEventListener('keyup', (e) => {
  //   if (e.key === 'a' || e.key === 'd') {
  //     rotYcam = 0;
  //   }
  // });
}

//ler arquivo .obj
document.getElementById('arq').addEventListener('change', function () {
  let fr = new FileReader();
  fr.onload = function () {
    lerArqObj(fr.result);
  };
  fr.readAsText(this.files[0]);
  // this.value = '';
});

function lerArqObj(conteudo) {
  let linhas = conteudo.split('\n');

  let modelo = new Modelo();

  let vertices = [];
  linhas.forEach((linha) => {
    let palavras = linha.replace(/(  )/gm, ' ').split(' ');
    if (palavras[0] === 'v') {
      vertices.push(
        new Vec3d(
          parseFloat(palavras[1]),
          -parseFloat(palavras[2]),
          -parseFloat(palavras[3])
        )
      );
    }
  });

  modelo.poligonos = [];
  linhas.forEach((linha) => {
    let palavras = linha.replace(/(  )/gm, ' ').split(' ');
    if (palavras[0] === 'f') {
      let poligono = new Poligono();
      for (i = 1; i < palavras.length; i++) {
        poligono.vertices.push(vertices[parseInt(palavras[i]) - 1]);
      }
      modelo.poligonos.push(poligono);
    }
  });

  Obj = modelo;
  vecCamera = new Vec3d(0, 0, -3);
}
