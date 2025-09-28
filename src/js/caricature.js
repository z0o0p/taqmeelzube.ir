const maxHorizontalOffset = 1.5;
const maxVerticalOffset = 1

function initializeEyeMovementEffect() {
  const leftPupil = document.getElementById("left-pupil");
  const rightPupil = document.getElementById("right-pupil");
  const overlay = document.getElementById("pupils-overlay");

  const leftMatrix = parseTransformMatrix(leftPupil.getAttribute("transform"));
  const rightMatrix = parseTransformMatrix(rightPupil.getAttribute("transform"));

  window.addEventListener("mousemove", (e) => {
    const rect = overlay.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = ((e.clientX - centerX) / rect.width) * maxHorizontalOffset * 2;
    const offsetY = ((e.clientY - centerY) / rect.height) * maxVerticalOffset * 2;

    leftPupil.setAttribute(
      "transform",
      `matrix(${leftMatrix[0]},${leftMatrix[1]},${leftMatrix[2]},${leftMatrix[3]},${
        leftMatrix[4] + offsetX
      },${leftMatrix[5] + offsetY})`
    );
    rightPupil.setAttribute(
      "transform",
      `matrix(${rightMatrix[0]},${rightMatrix[1]},${rightMatrix[2]},${rightMatrix[3]},${
        rightMatrix[4] + offsetX
      },${rightMatrix[5] + offsetY})`
    );
  });
}

function parseTransformMatrix(matrix) {
  const match = matrix.match(/matrix\(([^)]+)\)/);
  if (!match) return [1, 0, 0, 1, 0, 0];
  return match[1].split(",").map(Number);
}
