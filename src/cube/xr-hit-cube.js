import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";

let hitTestSource = null;
let hitTestSourceRequested = false;

// -- nơi chứa toàn bộ các đối tượng 3D trong một vũ trụ ThreeJS
// -- chứa camera, light, geometry, mesh, background,... thêm vào Scene thì mới hiển thị được
const scene = new THREE.Scene();

let sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// -- ánh sáng môi trường, ánh sáng tỏa đều khắp cảnh, không phụ thuộc vào vị trí
const light = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(light);

// -- tạo hình khối hộp trong không gian 3D,
// -- có 3 giá trị THREE.BoxGeometry(width, height, depth) --> (x,y,z)
// TODO:
// const geometry = new THREE.BoxGeometry(1, 1, 1);

// -- vật liệu tiêu chuẩn trong ThreeJS, dùng để làm các đối tượng 3D có hiệu ứng ánh sáng thực tế
// TODO:
// const materials = new THREE.MeshStandardMaterial({
//   color: 0xffffff * Math.random(),
// });

// -- vật thể 3D hoàn chỉnh THREE.Mesh(geometry, materials)
// TODO:
// const cube = new THREE.Mesh(geometry, materials);
// cube.position.set(0, 0, -2);
// scene.add(cube);

let reticle = new THREE.Mesh(
  new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
  new THREE.MeshStandardMaterial({
    color: 0xffffff * Math.random(),
  })
);
reticle.visible = false;
reticle.matrixAutoUpdate = false;
scene.add(reticle);

// -- camera trong ThreeJS, dùng để mô phỏng góc nhìn con người
// -- 4 giá trị THREE.PerspectiveCamera(fov, aspect, near, far)
// -- fov (góc nhìn chiều dọc, default: 75), aspect (tỉ lệ khung hình, default: window.innerWidth/window.innerHeight)
// -- near (khoảng cách gần nhất, ex: 0.1), far (khoảng cách xa nhất, ex: 1000)
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.set(0, 2, 5);
camera.lookAt(new THREE.Vector3(0, 0, 0));
scene.add(camera);

// --máy vẽ,chịu trách nhiệm hiển thị toàn bộ Scene trên browser bằng WebGL
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.xr.enabled = true;

document.body.appendChild(renderer.domElement);
document.body.appendChild(
  ARButton.createButton(renderer, {
    requiredFeatures: ["hit-test"],
  })
);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const materials = new THREE.MeshStandardMaterial({
  color: 0xffffff * Math.random(),
});
let controller = renderer.xr.getController(0);
controller.addEventListener("select", onSelect);
scene.add(controller);

function onSelect() {
  if (reticle.visible) {
    const cube = new THREE.Mesh(geometry, materials);
    cube.position.setFromMatrixPosition(reticle.matrix);
    cube.name = "cube";
    scene.add(cube);
  }
}

renderer.setAnimationLoop(render);

function render(timestamp, frame) {
  if (frame) {
    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();
    if (hitTestSourceRequested === false) {
      session.requestReferenceSpace("viewer").then((referenceSpace) => {
        session
          .requestHitTestSource({ space: referenceSpace })
          .then((source) => {
            hitTestSource = source;
          });
      });
      hitTestSourceRequested = true;
      session.addEventListener("end", () => {
        hitTestSourceRequested = false;
        hitTestSource = null;
      });
    }
    if (hitTestSource) {
      const hitTestResults = frame.getHitTestResults(hitTestSource);
      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        reticle.visible = true;
        reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
      } else {
        reticle.visible = false;
      }
    }
  }

  console.log("scene", scene.children);
  scene.children.forEach((object) => {
    if (object.name === "cube") {
      object.rotation.y += 0.01;
    }
  });
  // cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerWidth;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(window.devicePixelRatio);
});
