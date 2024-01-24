let canvas = document.getElementById("viewport");
let ctx = canvas.getContext("2d");

const larguraTela = canvas.width;
const alturaTela = canvas.height;
const origemTela = { x: canvas.width / 2, y: canvas.height / 2 };

let tempoDecorrido = 0.0;
let fTheta = 0.0;

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
}

// define um triângulo constituido de pontos no espaço 3D
class Triangulo {
  constructor(p1, p2, p3) {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
  }
}

class Poligono {
  constructor(vertices) {
    this.vertices = vertices ? vertices : [];
  }
}

// define um modelo 3D constituido de triângulos
class Modelo {
  constructor() {
    this.triangulos = undefined;
    this.poligonos = undefined;
  }
}

// métodos para criação de matrizes 4x4
class Matriz4x4 {
  constructor() {
    this.identidade = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
  }

  // matriz de projecao com valores de plano mais proximo, mais distante e campo de visão
  static projecao(fPerto, fLonge, fCdv) {
    let fAspecto = larguraTela / alturaTela; // razão de aspecto
    let fCdvRad = 1.0 / Math.tan((fCdv * 0.01) / (180.0 * Math.PI)); // campo de visão em radianos
    return [
      [fAspecto * fCdvRad, 0, 0, 0],
      [0, fCdvRad, 0, 0],
      [0, 0, fLonge / (fLonge - fPerto), 1],
      [0, 0, (-fLonge * fPerto) / (fLonge - fPerto), 0],
    ];
  }

  static rotacaoX(angulo) {
    return [
      [1, 0, 0, 0],
      [0, Math.cos(angulo), -Math.sin(angulo), 0],
      [0, Math.sin(angulo), Math.cos(angulo), 0],
      [0, 0, 0, 1],
    ];
  }

  static rotacaoY(angulo) {
    return [
      [Math.cos(angulo), 0, Math.sin(angulo), 0],
      [0, 1, 0, 0],
      [-Math.sin(angulo), 0, Math.cos(angulo), 0],
      [0, 0, 0, 1],
    ];
  }

  static rotacaoZ(angulo) {
    return [
      [Math.cos(angulo), -Math.sin(angulo), 0, 0],
      [Math.sin(angulo), Math.cos(angulo), 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
  }
}

////////////////////////// INICIALIZAÇÃO //////////////////////////

function InitViewport(params) {
  console.log("InitViewport");

  // criar matriz de projeção
  let matrizProj = Matriz4x4.projecao(0.1, 1000.0, 90.0);

  // cria um cubo de triangulos
  let cuboT = new Modelo();
  cuboT.triangulos = [
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

  //cria um cubo de poligonos
  let cuboP = new Modelo();
  cuboP.poligonos = [
    new Poligono([
      // FRENTE
      new Vec3d(0, 0, 0),
      new Vec3d(0, 0, 1),
      new Vec3d(1, 0, 1),
      new Vec3d(1, 0, 0),
    ]),
    new Poligono([
      // BAIXO
      new Vec3d(0, 0, 0),
      new Vec3d(0, 1, 0),
      new Vec3d(1, 1, 0),
      new Vec3d(1, 0, 0),
    ]),
    new Poligono([
      // TRAS
      new Vec3d(0, 1, 0),
      new Vec3d(0, 1, 1),
      new Vec3d(1, 1, 1),
      new Vec3d(1, 1, 0),
    ]),
    new Poligono([
      // DIREITA
      new Vec3d(1, 0, 0),
      new Vec3d(1, 1, 0),
      new Vec3d(1, 1, 1),
      new Vec3d(1, 0, 1),
    ]),
    new Poligono([
      // ESQUERDA
      new Vec3d(0, 1, 0),
      new Vec3d(0, 1, 1),
      new Vec3d(0, 0, 1),
      new Vec3d(0, 0, 0),
    ]),
    new Poligono([
      // TOPO
      new Vec3d(0, 0, 1),
      new Vec3d(0, 1, 1),
      new Vec3d(1, 1, 1),
      new Vec3d(1, 0, 1),
    ]),
  ];

  transladarModelo(cuboP, -0.5, -0.5, -0.5);

  // loop de renderização
  let tInicio = Date.now();
  setInterval(() => {
    limpaTela();
    transladarModelo(cuboP, 0, Math.cos(fTheta) * 0.005, 0);
    rotacionarY(cuboP, 0.3 * tempoDecorrido * 0.001);
    desenhaModelo(cuboP, matrizProj);
    tempoDecorrido = Date.now() - tInicio;
    document.getElementById("frame time").innerHTML = tempoDecorrido + "ms";
    fTheta += tempoDecorrido * 0.001;
    tInicio = Date.now();
  }, 1000 / 30);
}

////////////////////////// RENDER //////////////////////////

// limpa a tela do viewport
function limpaTela() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, larguraTela, alturaTela);
}

function desenhaModelo(modelo, matrizProj) {
  ctx.strokeStyle = "white";
  if (!modelo.triangulos) {
    modelo.poligonos.forEach((poligono) => {
      desenhaPoligono(poligono, matrizProj);
    });
  } else {
    modelo.triangulos.forEach((triangulo) => {
      desenhaTriangulo(triangulo, matrizProj);
    });
  }
}

// desenha na viewport um triangulo com de coordenadas 3D
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

  // ajustar coordenadas de projeção ao centro da tela
  p1Projetado.x += 1 * origemTela.x;
  p1Projetado.y += 1 * origemTela.y;
  p2Projetado.x += 1 * origemTela.x;
  p2Projetado.y += 1 * origemTela.y;
  p3Projetado.x += 1 * origemTela.x;
  p3Projetado.y += 1 * origemTela.y;

  // desenha linhas do triangulo
  ctx.beginPath();
  ctx.moveTo(p1Projetado.x, p1Projetado.y);
  ctx.lineTo(p2Projetado.x, p2Projetado.y);
  ctx.lineTo(p3Projetado.x, p3Projetado.y);
  ctx.lineTo(p1Projetado.x, p1Projetado.y);
  ctx.stroke();
}

// desenha na viewport um poligono com de coordenadas 3D
function desenhaPoligono(poligono, matrizProj) {
  // cria vetor de vértices projetados para viewport
  let vertsProj = [];
  poligono.vertices.forEach((vertice) => {
    vertice.z += 3;
    vertsProj.push(multiplicaMatrizPorVec3d(matrizProj, vertice));
    vertice.z -= 3;
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

////////////////////////// TRANSFORMAÇÕES //////////////////////////

function transladarModelo(modelo, x, y, z) {
  if (!modelo.triangulos) {
    modelo.poligonos.forEach((poligono) => {
      poligono.vertices.forEach((vertice) => {
        vertice.x += x;
        vertice.y += y;
        vertice.z += z;
      });
    });
  } else {
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
}

function rotacionarX(modelo, angulo) {
  if (!modelo.triangulos) {
    modelo.poligonos.forEach((poligono) => {
      poligono.vertices.forEach((vertice) => {
        let verticeR = multiplicaMatrizPorVec3d(
          Matriz4x4.rotacaoX(angulo),
          vertice
        );
        vertice.x = verticeR.x;
        vertice.y = verticeR.y;
        vertice.z = verticeR.z;
      });
    });
  } else {
    modelo.triangulos.forEach((triangulo) => {
      triangulo.p1 = multiplicaMatrizPorVec3d(
        Matriz4x4.rotacaoX(angulo),
        triangulo.p1
      );
      triangulo.p2 = multiplicaMatrizPorVec3d(
        Matriz4x4.rotacaoX(angulo),
        triangulo.p2
      );
      triangulo.p3 = multiplicaMatrizPorVec3d(
        Matriz4x4.rotacaoX(angulo),
        triangulo.p3
      );
    });
  }
}

function rotacionarY(modelo, angulo) {
  if (!modelo.triangulos) {
    modelo.poligonos.forEach((poligono) => {
      poligono.vertices.forEach((vertice) => {
        let verticeR = multiplicaMatrizPorVec3d(
          Matriz4x4.rotacaoY(angulo),
          vertice
        );
        vertice.x = verticeR.x;
        vertice.y = verticeR.y;
        vertice.z = verticeR.z;
      });
    });
  } else {
    modelo.triangulos.forEach((triangulo) => {
      triangulo.p1 = multiplicaMatrizPorVec3d(
        Matriz4x4.rotacaoY(angulo),
        triangulo.p1
      );
      triangulo.p2 = multiplicaMatrizPorVec3d(
        Matriz4x4.rotacaoY(angulo),
        triangulo.p2
      );
      triangulo.p3 = multiplicaMatrizPorVec3d(
        Matriz4x4.rotacaoY(angulo),
        triangulo.p3
      );
    });
  }
}

function rotacionarZ(modelo, angulo) {
  if (!modelo.triangulos) {
    modelo.poligonos.forEach((poligono) => {
      poligono.vertices.forEach((vertice) => {
        let verticeR = multiplicaMatrizPorVec3d(
          Matriz4x4.rotacaoZ(angulo),
          vertice
        );
        vertice.x = verticeR.x;
        vertice.y = verticeR.y;
        vertice.z = verticeR.z;
      });
    });
  } else {
    modelo.triangulos.forEach((triangulo) => {
      triangulo.p1 = multiplicaMatrizPorVec3d(
        Matriz4x4.rotacaoZ(angulo),
        triangulo.p1
      );
      triangulo.p2 = multiplicaMatrizPorVec3d(
        Matriz4x4.rotacaoZ(angulo),
        triangulo.p2
      );
      triangulo.p3 = multiplicaMatrizPorVec3d(
        Matriz4x4.rotacaoZ(angulo),
        triangulo.p3
      );
    });
  }
}

// escalar modelo em todas as dimensões
function escalonarModelo(modelo, escala) {
  if (!modelo.triangulos) {
    modelo.poligonos.forEach((poligono) => {
      poligono.vertices.forEach((vertice) => {
        vertice.x *= escala;
        vertice.y *= escala;
        vertice.z *= escala;
      });
    });
  } else {
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
}

////////////////////////// MATEMATICA //////////////////////////

function matrizParaVec3d(mat) {
  return new Vec3d(mat[0][0], mat[1][0], mat[2][0], mat[3][0]);
}

function multMatrizes(mat1, mat2) {
  const i1 = mat1.length;
  const j1 = mat1[0].length ? mat1[0].length : 1;
  const i2 = mat2.length;
  const j2 = mat2[0].length ? mat2[0].length : 1;

  if (j1 !== i2) {
    console.log("nao pode multiplicar");
    return 0;
  }

  let res = new Array(i1);
  for (i = 0; i < i1; i++) {
    res[i] = new Array(j2);
  }

  for (i = 0; i < i1; i++) {
    for (j = 0; j < j2; j++) {
      res[i][j] = 0;
      for (x = 0; x < i2; x++) {
        res[i][j] += mat1[i][x] * mat2[x][j];
      }
    }
  }

  return res;
}

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

  return new Vec3d(x, y, z, w);
}
