const ViewSwitcherSelector = Object.freeze({
  SwitcherId: "[data-switcher-id]",
  SwitcherFor: "[data-switcher-for]",
  SwitcherView: "[data-switcher-view]",
});

export function setupViewSwitchers() {
  const views = Array.from(document.querySelectorAll(ViewSwitcherSelector.SwitcherId));
  const switchboards = Array.from(document.querySelectorAll(ViewSwitcherSelector.SwitcherFor));
  for (const switchboard of switchboards) {
    const viewSwitcherId = switchboard.dataset.switcherFor;
    const switchView = views.find(view => view.dataset.switcherId === viewSwitcherId);
    if (!switchView) {
      console.warn(`Could not find appropriate switch view for switchboard id "${viewSwitcherId}". `);
      continue;
    }
    const switchRadios = Array.from(switchboard.querySelectorAll(ViewSwitcherSelector.SwitcherView));
    const allViews = switchRadios.map(radio => radio.dataset.switcherView);
    for (const radio of switchRadios)
      // When clicking directly on the radio circle, only "click" is fired. Otherwise "change" is fired.
      for (const eventName of ["click", "change"])
        radio.addEventListener(eventName, (event) => {
          console.log("test")
          const newView = radio.dataset.switcherView;
          switchView.classList.remove(...allViews);
          switchView.classList.add(newView);
        });
  }
}
