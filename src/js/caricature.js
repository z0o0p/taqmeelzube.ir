const maxOffsetX = 1.5;
const maxOffsetY = 0.75;

function initializeCaricatureEyeMovementEffect() {
  const leftPupil = document.getElementById("left-pupil");
  const rightPupil = document.getElementById("right-pupil");
  const overlay = document.getElementById("pupils-overlay");

  const leftPupilMatrix = parseTransformMatrix(leftPupil.getAttribute("transform"));
  const rightPupilMatrix = parseTransformMatrix(rightPupil.getAttribute("transform"));

  window.addEventListener("mousemove", (e) => {
    const boundary = overlay.getBoundingClientRect();
    const centerX = boundary.left + boundary.width / 2;
    const centerY = boundary.top + boundary.height / 2;
    const offsetX = ((e.clientX - centerX) / boundary.width) * maxOffsetX * 2;
    const offsetY = ((e.clientY - centerY) / boundary.height) * maxOffsetY * 2;

    leftPupil.setAttribute(
      "transform",
      `matrix(${leftPupilMatrix[0]},${leftPupilMatrix[1]},${leftPupilMatrix[2]},${leftPupilMatrix[3]},${leftPupilMatrix[4] + offsetX},${leftPupilMatrix[5] + offsetY})`
    );
    rightPupil.setAttribute(
      "transform",
      `matrix(${rightPupilMatrix[0]},${rightPupilMatrix[1]},${rightPupilMatrix[2]},${rightPupilMatrix[3]},${rightPupilMatrix[4] + offsetX},${rightPupilMatrix[5] + offsetY})`
    );
  });
}

function parseTransformMatrix(matrix) {
  const match = matrix.match(/matrix\(([^)]+)\)/);
  if (!match) return [1, 0, 0, 1, 0, 0];
  return match[1].split(",").map(Number);
}
