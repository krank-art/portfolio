export function setupMultiButtons() {
  const multiButtons = Array.from(document.getElementsByClassName("multi-button"));
  for (const multiButton of multiButtons)
    setupMultiButton(multiButton);
}

function setMultiButtonEnabled(button, enabled) {
  if (enabled === true) {
    button.classList.add("active");
    button.setAttribute("aria-checked", "true");
    return;
  }
  if (enabled === false) {
    button.classList.remove("active");
    button.setAttribute("aria-checked", "false");
    return;
  }
  throw new Error(`Illegal enabled state '${enabled}'`);
}

function setupMultiButton(element) {
  const buttons = Array.from(element.querySelectorAll(".multi-button-item"));
  for (const button of buttons) {
    const radio = button.querySelector("input[type=radio]");
    // Update initial design on page load
    if (radio.checked) setMultiButtonEnabled(button, true);
    // Forward clicks on button to radio
    button.addEventListener("click", (event) => radio.click());
    // Add event listener to change looks of parent button
    for (const eventName of ["click", "change"])
      radio.addEventListener(eventName, (event) => {
        buttons.forEach(singleButton => setMultiButtonEnabled(singleButton, false));
        setMultiButtonEnabled(button, true);
      });
  }
}
