export function displayDialogue(text, onDisplayEnd) {
  const dialogueUI = document.getElementById("textbox-container");
  const dialogue = document.getElementById("dialogue");

  dialogueUI.style.display = "block";
  let index = 0;
  let currentText = "";
  const intervalRef = setInterval(() => {
    if (index < text.length) {
      currentText += text[index];
      dialogue.innerHTML = currentText;
      index++;
      return;
    }

    clearInterval(intervalRef);
  }, 1);

  const closeBtn = document.getElementById("close");

  function onCloseBtnClick() {
    onDisplayEnd();
    dialogueUI.style.display = "none";
    dialogue.innerHTML = "";
    clearInterval(intervalRef);
    closeBtn.removeEventListener("click", onCloseBtnClick);
  }

  closeBtn.addEventListener("click", onCloseBtnClick);

  setTimeout(() => {
    document.addEventListener("click", function onDocClick(e) {
      if (!dialogueUI.contains(e.target)) {
        closeBtn.click();
        document.removeEventListener("click", onDocClick);
      }
    });
  }, 300);

  addEventListener("keypress", (key) => {
    if (key.code === "Enter") {
      closeBtn.click();
    }
  });
}

export function setCamScale(k) {
  const ratio = window.innerWidth / window.innerHeight;
  if (ratio < 1) {
    k.camScale(k.vec2(0.6));
  } else if (ratio < 1.3) {
    k.camScale(k.vec2(0.8));
  } else {
    k.camScale(k.vec2(1));
  }
}