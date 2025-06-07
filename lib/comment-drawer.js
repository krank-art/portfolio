class CanvasHistory {
  constructor({ maxSize = 20, callbacks }) {
    this.maxSize = maxSize;
    this.states = [];
    // We will record ALL input provided to the canvas history, but toss out the pixel data if the amount of states
    // go beyond maxSize. These are special states that are intended for the playback function.
    this.shadowStates = [];
    this.index = -1;
    this.sequenceNumber = 0;
    this.callbacks = callbacks;
  }

  static duplicateImageData(imageData) {
    return new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
  }

  static upscaleImageData(imageData, scale) {
    const { data: src, width: srcWidth, height: srcHeight } = imageData;
    const destWidth = srcWidth * scale;
    const destHeight = srcHeight * scale;
    const destImageData = new ImageData(destWidth, destHeight);
    const dest = destImageData.data;

    for (let y = 0; y < srcHeight; y++) {
      for (let x = 0; x < srcWidth; x++) {
        const srcIndex = (y * srcWidth + x) * 4;
        const r = src[srcIndex];
        const g = src[srcIndex + 1];
        const b = src[srcIndex + 2];
        const a = src[srcIndex + 3];

        // Fill the scale × scale block
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const destX = x * scale + dx;
            const destY = y * scale + dy;
            const destIndex = (destY * destWidth + destX) * 4;
            dest[destIndex] = r;
            dest[destIndex + 1] = g;
            dest[destIndex + 2] = b;
            dest[destIndex + 3] = a;
          }
        }
      }
    }
    return destImageData;
  }


  add({ brush, size, pattern, path, pixelData }) {
    /*
     * Note: pixelData represents the image data *before* the current stroke has been applied.
     * It's a bit awkard, but the problem is that the delicate drawing process can be interrupted
     * by any event caused by the user or browser. If we add an entry at the very start, we can
     * rest safely that most of the relevant data is remembered by the history.
     */
    this.trim();
    // TODO: Copy missing settings, prolly like color space
    this.states.push({
      id: `record-${this.sequenceNumber}`,
      brush,
      size,
      pattern,
      path,
      pixelData: CanvasHistory.duplicateImageData(pixelData),
    });
    this.sequenceNumber++;
    if (this.states.length > this.maxSize) {
      const shadowState = this.states.shift();
      shadowState.pixelData = null;
      this.shadowStates.push(shadowState);
    } else {
      this.index++;
    }
    this.notify();
  }

  static areImageDataEqual(data1, data2, scale = 1) {
    if (data1.width !== data2.width) return false;
    if (data1.height !== data2.height) return false;
    const buffer1 = data1.data;
    const buffer2 = data2.data;
    if (buffer1.length !== buffer2.length) return false;
    // If we scale the canvas, we can get away with checking only the very first pixel of the image data.
    // This reduces the checked pixel count from (pixels * scale^2) to (pixels * 1).
    const increment = scale * 4; // the 4 channels RGBA
    for (let i = 0; i < buffer1.length; i += increment) {
      if (buffer1[i] !== buffer2[i]) return false;
      if (buffer1[i + 1] !== buffer2[i + 1]) return false;
      if (buffer1[i + 2] !== buffer2[i + 2]) return false;
      if (buffer1[i + 3] !== buffer2[i + 3]) return false;
    }
    return true;
  }

  get size() {
    return this.states.length;
  }

  get inputs() {
    const activeStates = this.states.slice(0, this.index + 1);
    const records = [...this.shadowStates, ...activeStates];
    return records.map(record => {
      const { brush, size, pattern, path } = record;
      return { brush, size, pattern, path };
    });
  }

  get inputsSinceLastClear() {
    const inputs = this.inputs;
    const lastIndex = [...inputs].reverse().findIndex(record => record.brush === "clear");
    if (lastIndex === -1) return inputs;
    const start = inputs.length - lastIndex - 1;
    return inputs.slice(start);
  }

  undo() {
    if (this.states.length === 0)
      return null;
    this.index = Math.max(0, this.index - 1);
    const lastState = this.states[this.index];
    this.notify();
    return lastState;
  }

  redo() {
    if (this.states.length === 0)
      return null;
    this.index = Math.min(this.states.length, this.index + 1);
    const nextSate = this.states[this.index];
    this.notify();
    return nextSate;
  }

  trim() {
    if (this.index < this.states.length - 1) {
      this.states = this.states.slice(0, this.index + 1);
    }
    this.notify();
  }

  hasMoreUndos() {
    if (this.states.length < 2)
      return false;
    return this.index > 0;
  }

  hasMoreRedos() {
    if (this.states.length < 2)
      return false;
    return this.index < this.states.length - 1;
  }

  reset() {
    this.states = [];
    this.index = -1;
    this.notify();
  }

  notify() {
    if (!this.callbacks || this.callbacks.length <= 0) return;
    for (const callback of this.callbacks) callback();
  }
}

export default class CommentDrawer {
  constructor({ width, height, scale, container, onSubmit }) {
    // Static properties
    this.width = width;
    this.height = height;
    this.scale = scale;
    this.container = container;
    this.onSubmit = onSubmit;
    this.initTemplate();
    this.canvas = CommentDrawer.initCanvas({
      width: this.width,
      height: this.height,
      scale: this.scale,
      container: this.container.querySelector("[data-control-id=comment-board]"),
    });
    // This is the raw image data that always has a scale of 1. When showing the canvas with different scales, 
    // this data is simply upscaled and the canvas flushed (it's imageData updated).
    // Working with raw image data makes programming the brush engine, brush history and rescaling a lot easier.
    this.imageData = new ImageData(this.width, this.height);
    this.lastImageData = null;
    this.history = new CanvasHistory({
      callbacks: [
        (() => { this.updateButtonControls() }).bind(this),
      ]
    });

    // Dynamic properties
    this.acceptsInput = true;
    this.pattern = null;
    this.brush = null;
    this.size = -1;
    this.drawing = false;
    this.currentRecord = null;
    this.currentPath = [];
    this.lastKnownPosition = { x: null, y: null };

    // HTML element controls
    this.undoButton = null;
    this.redoButton = null;
    this.playbackButton = null;
    this.downloadButton = null;
    this.fullscreenButton = null;
    this.resetButton = null;
    this.submitButton = null;
    this.aboutButton = null;
    this.toolRadios = null;
    this.buttonRadios = null;
    this.resize({});

    // Initialize controls
    this.initMouseControls();
    this.initButtonControls();
    this.initHotkeys();
    this.clear();
  }

  get isFullscreen() {
    return document.fullscreenElement === this.container;
  }

  static initCanvas({ width, height, scale, container }) {
    const canvas = document.createElement("canvas");
    canvas.classList.add("comment-canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    container.appendChild(canvas);
    return canvas;
  }

  isDirty() {
    const pixels = this.imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] !== 255) return true;
      if (pixels[i + 1] !== 255) return true;
      if (pixels[i + 2] !== 255) return true;
      if (pixels[i + 3] !== 255) return true;
    }
    return false;
  }

  drawPixelLine({ from, to, brusher = null }) {
    const maxPixelDrawing = 10000;
    let x0 = Math.round(from.x), y0 = Math.round(from.y);
    let x1 = Math.round(to.x), y1 = Math.round(to.y);

    let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    let dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;

    let currentPixelDrawingLimit = 0;
    while (currentPixelDrawingLimit < maxPixelDrawing) {
      brusher ? brusher(x0, y0) : this.drawPixel({ x: x0, y: y0 });
      currentPixelDrawingLimit++;
      if (x0 === x1 && y0 === y1) break;
      let e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  drawOnCanvas(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const rawX = clientX - rect.left;
    const rawY = clientY - rect.top;
    const x = Math.round(rawX / this.scale);
    const y = Math.round(rawY / this.scale);
    const currentPosition = { x, y };
    this.currentPath.push(currentPosition);
    const color = this.brush === "eraser" ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
    const toolPattern = this.brush === "eraser" ? "100%" : this.pattern;
    this.drawPixelLine({
      from: this.lastKnownPosition.x && this.lastKnownPosition.y ? this.lastKnownPosition : currentPosition,
      to: currentPosition,
      brusher: (x, y) => this.drawSquare({ x, y, size: this.size, pattern: toolPattern, color }),
    });
    this.flush();
    this.lastKnownPosition.x = currentPosition.x;
    this.lastKnownPosition.y = currentPosition.y;
  }

  stopDrawingOnCanvas() {
    this.drawing = false;
    this.lastKnownPosition.x = null;
    this.lastKnownPosition.y = null;
    this.remember(this.currentRecord);
    // We need to push the record only when the current stroke ends.
    // The image data is passed by reference and will change while the brush stroke is still ongoing.
  }

  initTemplate() {
    const createRadio = ({ radioName, value, checked, icon, label }) => `
    <label class="row-multi-button">
      <input class="row-button-radio" type="radio" name="${radioName}" value="${value}" ${checked ? 'checked' : ''}>
      <span class="row-button-label">
        <i class="row-button-icon ${icon}"></i>
        <span class="row-button-text">${label}</span>
      </span>
    </label>
  `;
    const brushRadios = [
      { radioName: "tool", value: "brush2", checked: true, icon: "bi-pen-1", label: "Brush 2" },
      { radioName: "tool", value: "brush3", checked: false, icon: "bi-pen-2", label: "Brush 3" },
      { radioName: "tool", value: "brush5", checked: false, icon: "bi-pen-3", label: "Brush 5" },
      { radioName: "tool", value: "brush10", checked: false, icon: "bi-pen-5", label: "Brush 10" },
    ];
    const eraserRadios = [
      { radioName: "tool", value: "eraser3", checked: false, icon: "bi-eraser-1", label: "Eraser 3" },
      { radioName: "tool", value: "eraser5", checked: false, icon: "bi-eraser-2", label: "Eraser 5" },
      { radioName: "tool", value: "eraser7", checked: false, icon: "bi-eraser-3", label: "Eraser 7" },
      { radioName: "tool", value: "eraser12", checked: false, icon: "bi-eraser-5", label: "Eraser 12" },
    ];
    const patternRadios = [
      { radioName: "pattern", value: "100%", checked: true, icon: "bi-pattern-1", label: "Solid" },
      { radioName: "pattern", value: "75%", checked: false, icon: "bi-pattern-2", label: "Pattern 75%" },
      { radioName: "pattern", value: "50%", checked: false, icon: "bi-pattern-3", label: "Pattern 50%" },
      { radioName: "pattern", value: "25%", checked: false, icon: "bi-pattern-4", label: "Pattern 25%" },
    ];
    const createButton = ({ buttonId, icon, label, classes }) => `
    <button type="button" class="row-button ${classes ?? ''}" data-control-id="${buttonId}">
      <i class="row-button-icon ${icon}"></i>
      <span class="row-button-text">${label}</span>
    </button>
  `;
    const resetButton = createButton({ buttonId: "reset", icon: "bi-clear", label: "Clear", classes: "negative-button" });
    const undoButton = createButton({ buttonId: "undo", icon: "bi-undo", label: "Undo", classes: null });
    const redoButton = createButton({ buttonId: "redo", icon: "bi-redo", label: "Redo", classes: null });
    const aboutButton = createButton({ buttonId: "about", icon: "bi-about", label: "About", classes: null });
    const playbackButton = createButton({ buttonId: "playback", icon: "bi-play", label: "Play", classes: null });
    const downloadButton = createButton({ buttonId: "download", icon: "bi-save", label: "Save", classes: null });
    const fullscreenButton = createButton({ buttonId: "fullscreen", icon: "bi-fullscreen", label: "Fullscreen", classes: null });
    const submitButton = createButton({ buttonId: "submit", icon: "bi-submit", label: "Submit", classes: "positive-button" });
    this.container.innerHTML = `
    <div class="comment-drawer-inner">
      <div data-control-id="tools-brushes" class="tool-bar">
        <div class="row-button-group">${brushRadios.map(radio => createRadio(radio)).join("")}</div>
        <div class="row-button-group at-end">${eraserRadios.map(radio => createRadio(radio)).join("")}</div>
      </div>
      <div data-control-id="tools-patterns" class="tool-bar">
        <div class="row-button-group">${patternRadios.map(radio => createRadio(radio)).join("")}</div>
        <div class="row-button-group at-end">${resetButton}</div>
      </div>
      <div data-control-id="comment-board"></div>
      <div data-control-id="tools-main" class="tool-bar">
        <div class="row-button-group">${undoButton + redoButton}</div>
        <div class="row-button-group">${aboutButton + playbackButton + downloadButton}</div>
        <div class="row-button-group">${fullscreenButton}</div>
        <div class="row-button-group at-end">${submitButton}</div>
      </div>
    </div>
  `;
  }

  initMouseControls() {
    const onMouseDown = ((clientX, clientY) => {
      if (!this.acceptsInput) return;
      this.drawing = true;
      // We could save brush type and brush size per single point in path to apply neat effects.
      // Like if we track velocity of the brush, we could do a try brushing effect (opacity decreases).
      // For now we will use the simple approach and keep brush type and brush size constant per each stroke.
      this.currentPath = [];
      this.currentRecord = {
        brush: this.brush,
        size: this.size,
        pattern: this.pattern,
        path: this.currentPath,
        pixelData: this.imageData,
      };
      this.drawOnCanvas(clientX, clientY);
    }).bind(this);

    const onMouseMove = ((clientX, clientY) => {
      if (!this.acceptsInput) return;
      if (!this.drawing) return;
      this.drawOnCanvas(clientX, clientY);
    }).bind(this);

    const onMouseUp = (() => {
      if (this.drawing) this.stopDrawingOnCanvas();
    }).bind(this);

    const onMouseLeave = (() => {
      // Note: This event is called every time the mouse leaves the canvas, no matter if the LMB is pressed down.
      if (this.drawing) this.stopDrawingOnCanvas();
    }).bind(this);

    this.canvas.addEventListener("mousedown", (e) => { onMouseDown(e.clientX, e.clientY) });
    this.canvas.addEventListener("mousemove", (e) => { onMouseMove(e.clientX, e.clientY) });
    this.canvas.addEventListener("mouseup", onMouseUp);
    this.canvas.addEventListener("mouseleave", onMouseLeave);

    const listenToTouch = (listener, touchEvent, passCoordinates = true) => {
      touchEvent.preventDefault();
      const touch = touchEvent.touches[0];
      if (passCoordinates)
        listener(touch.clientX, touch.clientY);
      else
        listener();
    };
    this.canvas.addEventListener("touchstart", (e) => { listenToTouch(onMouseDown, e) });
    this.canvas.addEventListener("touchmove", (e) => { listenToTouch(onMouseMove, e) });
    this.canvas.addEventListener("touchend", (e) => { listenToTouch(onMouseUp, e, false) });
    this.canvas.addEventListener("touchcancel", (e) => { listenToTouch(onMouseLeave, e, false) });
  }

  initButtonControls() {
    this.submitButton = this.container.querySelector("[data-control-id=submit]");
    this.submitButton.addEventListener("click", () => {
      if (!this.onSubmit) return;
      const imageRaw = this.serializeImage();
      const imageActions = this.history.inputs; // Watch out, this is passed by reference!
      this.onSubmit(imageRaw, imageActions);
    });

    this.undoButton = this.container.querySelector("[data-control-id=undo]");
    this.undoButton.addEventListener("click", () => {
      if (!this.history.hasMoreUndos())
        return;
      const { brush, size, pattern, path, pixelData } = this.history.undo();
      this.imageData = CanvasHistory.duplicateImageData(pixelData);
      this.lastImageData = CanvasHistory.duplicateImageData(pixelData);
      // We have to update the history again, because history callbacks are invoked before the undo state is applied.
      this.history.notify();
      this.flush();
    });

    this.redoButton = this.container.querySelector("[data-control-id=redo]");
    this.redoButton.addEventListener("click", () => {
      if (!this.history.hasMoreRedos())
        return;
      const { brush, size, pattern, path, pixelData } = this.history.redo();
      this.imageData = CanvasHistory.duplicateImageData(pixelData);
      this.lastImageData = CanvasHistory.duplicateImageData(pixelData);
      // We have to update the history again, because history callbacks are invoked before the redo state is applied.
      this.history.notify();
      this.flush();
    });

    this.playbackButton = this.container.querySelector("[data-control-id=playback]");
    this.playbackButton.addEventListener("click", () => {
      this.playback(100);
    });

    this.downloadButton = this.container.querySelector("[data-control-id=download]");
    this.downloadButton.addEventListener("click", () => {
      const link = document.createElement("a");
      link.download = "drawing.png";
      link.href = this.serializeImage();
      link.click();
    });

    this.resetButton = this.container.querySelector("[data-control-id=reset]");
    this.resetButton.addEventListener("click", ((e) => {
      this.clear();
      // It is awkward to have redos left after clearing the image.
      // This can happen when clearing, drawing something, hitting undo and then clear again.
      // Because no changes happened since the last clear, the new clear is not added to the history.
      // Normally when adding a new record to the history, all remaining redos are trimmed.
      // We now have to remove the redos manually to circumvent the awkwardness.
      this.history.trim();
      // We have to update the history again, because history callbacks are invoked before the reset button is applied.
      this.history.notify();
    }).bind(this));

    this.aboutButton = this.container.querySelector("[data-control-id=about]");
    this.aboutButton.addEventListener("click", () => {
      alert("Created by Krank (c) 2025");
      // TODO show custom dialogue
    });

    this.fullscreenButton = this.container.querySelector("[data-control-id=fullscreen]");
    document.addEventListener('fullscreenchange', () => {
      // We shouldn't resize on any fullscreen change, but sadly there is no easy way to determine what the previous 
      //  fullscreen element was when fullscreen is exited. We need this, bc on enter and exiting we resize the drawer.
      //
      // Ugh, the endless fiddling with the comment tool is draining my snoot..... hold on, thats not my line
      // I mean, draining my brain
      // I refactored the tool to be responsive to design changes, but for the target platform (mobile) it sadly doesnt work
      // I'd need to lock the screen orientation for it to make sense, and even then mobile CSS does not use physical pixels, 
      // rather logical pixels. that means depending on the pixel density and logical scaling, 1px in CSS equates to 4 pixels 
      // on the display. this works great for 95% of webdesign bc it makes the style interchangeable between desktop and mobile
      // but now for this drawing tool, it makes the canvas and buttons blurry and prevents the resize function from 
      // recalculating it to fit nicely. oh and the screen orientation API is still in the proposal stage while the old 
      // hack got removed, so I cant force the orientation. I could add a button that manually flips the comment drawer, 
      // but that is such a headache rewriting the functions to transform the input coordinates. also im sure misusing a 
      // phone in portrait to simulate landscape will cause it to flip over at awkward times.
      this.resize({ ignoreHeight: !this.isFullscreen });
    });

    this.fullscreenButton.addEventListener("click", async () => {
      if (this.isFullscreen) {
        document.exitFullscreen();
        return;
      }
      this.container.requestFullscreen();
    });

    const toolRadioElements = Array.from(this.container.querySelectorAll(".row-button-radio[name='tool']"));
    this.toolRadios = toolRadioElements.map(element => {
      const value = element.value;
      const match = value.match(/^([a-zA-Z]+).*?([0-9]+)$/);
      const brushType = match[1];
      const brushSize = parseInt(match[2]);
      return { id: value, element, brushType, brushSize };
    });
    for (const radio of this.toolRadios)
      radio.element.addEventListener("change", (event) => {
        const toolRadio = this.toolRadios.find(radio => radio.id === event.target.value);
        this.brush = toolRadio.brushType;
        this.size = toolRadio.brushSize;
        //console.log(brush, size);
      });

    const initialBrush = this.toolRadios.find(radio => radio.element.checked);
    this.brush = initialBrush.brushType;
    this.size = initialBrush.brushSize;

    this.patternRadios = Array.from(this.container.querySelectorAll(".row-button-radio[name='pattern']"));
    for (const radio of this.patternRadios)
      radio.addEventListener("change", (event) => {
        this.pattern = event.target.value;
        //console.log(value);
      });
    const initialPattern = this.patternRadios.find(radio => radio.checked);
    this.pattern = initialPattern.value;
  }

  updateButtonControls() {
    this.undoButton.disabled = !this.acceptsInput || !this.history.hasMoreUndos();
    this.redoButton.disabled = !this.acceptsInput || !this.history.hasMoreRedos();
    this.resetButton.disabled = !this.acceptsInput || !this.isDirty() && !this.history.hasMoreRedos();
    this.submitButton.disabled = !this.acceptsInput || !this.isDirty();
    this.playbackButton.disabled = !this.acceptsInput || !this.isDirty() || !this.history.hasMoreUndos();
    this.downloadButton.disabled = !this.acceptsInput || !this.isDirty();
    this.aboutButton.disabled = !this.acceptsInput;
  }

  initHotkeys() {
    const brushTools = this.toolRadios.filter(radio => radio.brushType === "brush");
    const eraserTools = this.toolRadios.filter(radio => radio.brushType === "eraser");
    const getActiveToolIndex = () => {
      const brushIndex = brushTools.findIndex(radio => radio.element.checked);
      const eraserIndex = eraserTools.findIndex(radio => radio.element.checked);
      const toolIndex = brushIndex >= 0 ? brushIndex : eraserIndex;
      const activeTool = brushIndex >= 0 ? "brush" : "eraser";
      const targetTools = activeTool === "eraser" ? eraserTools : brushTools;
      return { toolIndex, activeTool, targetTools };
    };
    const incrementSelectedTool = (increment) => {
      const { toolIndex, targetTools } = getActiveToolIndex();
      const currentIndex = toolIndex + increment;
      const maxIndex = targetTools.length - 1;
      const targetIndex = Math.max(0, Math.min(currentIndex, maxIndex));
      targetTools[targetIndex].element.click();
    };
    document.addEventListener('keydown', ((event) => {
      if (!this.isFullscreen) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault(); // prevent browser undo
        this.undoButton.click();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        this.redoButton.click();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        this.downloadButton.click();
      }
      if (event.key.toLowerCase() === 'r') {
        console.log("clear");
        this.resetButton.click();
      }
      if (event.key.toLowerCase() === 'b') {
        const { toolIndex } = getActiveToolIndex();
        brushTools[toolIndex].element.click();
      }
      if (event.key.toLowerCase() === 'e') {
        const { toolIndex } = getActiveToolIndex();
        eraserTools[toolIndex].element.click();
      }
      if (["1", "2", "3", "4"].some(key => key === event.key.toLowerCase())) {
        const digit = parseInt(event.key);
        const { targetTools } = getActiveToolIndex();
        targetTools[digit - 1].element.click();
      }
      if (["5", "6", "7", "8"].some(key => key === event.key.toLowerCase())) {
        const digit = parseInt(event.key);
        this.patternRadios[digit - 5].click();
      }
      if (event.key.toLowerCase() === 'p') {
        this.playbackButton.click();
      }
      if (event.key.toLowerCase() === '+') {
        incrementSelectedTool(1);
      }
      if (event.key.toLowerCase() === '-') {
        incrementSelectedTool(-1);
      }
    }).bind(this));
  }

  drawPixel({ x, y }) {
    const { width } = this.imageData;
    const index = (y * width + x) * 4;
    imageData.data[index] = 0;     // Red
    imageData.data[index + 1] = 0; // Green
    imageData.data[index + 2] = 0; // Blue
    imageData.data[index + 3] = 255; // Alpha (fully opaque)
  }

  drawSquare({ x, y, size = 2, pattern = null, color = { r: 0, g: 0, b: 0 } }) {
    const centerX = x - Math.round(size / 2);
    const centerY = y - Math.round(size / 2);
    const pixels = this.imageData.data;
    const bottomLimit = -1 * Math.floor(size / 2);
    const topLimit = Math.ceil(size / 2);
    for (let dy = bottomLimit; dy < topLimit; dy++) {
      for (let dx = bottomLimit; dx < topLimit; dx++) {
        // nx = "new X", dx = "delta X"
        // ny = "new Y", dy = "delta Y"
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx > this.width || ny > this.height)
          continue;
        const pixelIsDrawable = () => {
          if (!pattern || pattern === "100%")
            return true;
          if (pattern === "25%")
            return nx % 2 === 0 && ny % 2 === 0;
          if (pattern === "50%")
            return (nx + ny) % 2 === 0;
          if (pattern === "75%")
            /*
            * We need to do odd lines so 75% pattern does not stack up with the 50% and 25% pattern
            * A known issue is that now when we put the 75% pattern and 25% pattern horizontally next to each other,
            * we get a small line of fuzz (essentially 50% pattern) because of how the 75% pattern is offset.
            * This is not a huge deal, but that means vertical lines that swap from 75% to 25% look slighty fuzzy.
            * We could turn the 75% pattern by rotating 180°, but then we have fuzzy horizontal lines.
            * Since our artboard is in orientation landscape, it is prolly smarter to keep the fuzz in that direction.
            * Besides, this small problem is a lot better than before where 75% and 25% pattern stacked to solid black.
            */
            return nx % 2 === 0 || ny % 2 === 1;
          throw new Error(`Unknown pattern '${pattern}'. `);
        }
        if (!pixelIsDrawable())
          continue;
        const index = (ny * this.width + nx) * 4;
        const { r, g, b } = color;
        pixels[index] = r;
        pixels[index + 1] = g;
        pixels[index + 2] = b;
        pixels[index + 3] = 255; // Alpha (fully opaque)
      }
    }
  }

  flush() {
    const scaledImageData = CanvasHistory.upscaleImageData(this.imageData, this.scale);
    this.canvas.getContext("2d").putImageData(scaledImageData, 0, 0);
  }

  clear(addToHistory = true) {
    const data = this.imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;     // Red
      data[i + 1] = 255; // Green
      data[i + 2] = 255; // Blue
      data[i + 3] = 255; // Alpha
    }
    this.flush();
    if (addToHistory)
      this.remember({
        brush: "clear",
        size: null,
        pattern: null,
        path: null,
        pixelData: this.imageData,
      });
  }

  resize({ scaleOverride = null, ignoreHeight = false }) {
    const style = getComputedStyle(this.container);
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const paddingRight = parseFloat(style.paddingRight) || 0;
    const availableWidth = this.container.clientWidth - paddingLeft - paddingRight;
    // Using height makes no sense unless we can guarantee that the element has a fixed height.
    const paddingTop = parseFloat(style.paddingLeft) || 0;
    const paddingBottom = parseFloat(style.paddingRight) || 0;
    const availableHeight = this.container.clientHeight - paddingTop - paddingBottom;
    // This value is set manually by adding the toolbars heights and the margin between.
    const controlsHeight = 108;

    const availableWidthFactors = Math.floor(availableWidth / this.width);
    const availableHeightFactors = Math.floor(availableHeight / (this.height + controlsHeight));
    const sizeFactor = ignoreHeight ? availableWidthFactors : Math.min(availableWidthFactors, availableHeightFactors);

    this.scale = scaleOverride ?? sizeFactor;
    this.container.dataset.scale = this.scale;
    this.canvas.width = this.width * this.scale;
    this.canvas.height = this.height * this.scale;

    this.flush();
  }

  serializeImage(scale = 1) {
    const newImageData = CanvasHistory.upscaleImageData(this.imageData, scale);
    const newCanvas = document.createElement("canvas");
    newCanvas.width = newImageData.width;
    newCanvas.height = newImageData.height;
    newCanvas.getContext('2d').putImageData(newImageData, 0, 0);
    return newCanvas.toDataURL("image/png");
  }

  remember(record) {
    const currentImageData = record.pixelData;
    if (!this.lastImageData || !CanvasHistory.areImageDataEqual(this.lastImageData, currentImageData)) {
      this.history.add(record);
    } else {
      // console.log("last image data was the same, not recording in history", this.history.size);
    }
    this.lastImageData = CanvasHistory.duplicateImageData(currentImageData);
  }

  playback(speed = 10) {
    this.acceptsInput = false;
    this.updateButtonControls();
    this.clear(false);
    /*
     * TODO?: Make delay based on distance rather than individual points
     * The problem is that currently the playback slows down considerably when the user was moving 
     * their mouse slowly around a corner and then suddenly jumps forward with a big sweeping stroke.
     * Also: Add delay between lifting the brush stroke and the next brush. Looks a bit weird when a
     * cloud of dots appears almost instantly.
     */
    const delay = Math.round(1000 / speed);
    const bigDelay = delay * 10;
    let totalDelay = 0;
    // When doing playback, it is awkward when brush strokes are shown that then get entirely wiped by a clear.
    // On the other hand, if we remove all previous undos when clearing the canvas, the user cannot undo a clear.
    // So to have the best of both worlds, we will only playback since the last clear of the canvas.
    // This causes previous images before a clear to be reconstructable by using the full inputs history.
    // TODO: Only export the trimmed inputs instead of the full inputs.
    for (const action of this.history.inputsSinceLastClear) {
      const { brush, size, pattern, path } = action;
      if (brush === "clear") {
        setTimeout(() => {
          this.clear(false);
          this.flush();
        }, totalDelay);
        totalDelay += bigDelay;
        continue;
      }
      if (path.length === 0) continue;
      const maxIndex = path.length === 1 ? path.length : path.length - 1;
      for (let i = 0; i < maxIndex; i++) {
        const currentPoint = path[i];
        const nextPoint = path[i + 1] ?? currentPoint;
        const color = brush === "eraser" ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
        const toolPattern = brush === "eraser" ? "100%" : pattern;
        setTimeout(() => {
          this.drawPixelLine({
            from: currentPoint,
            to: nextPoint,
            brusher: (x, y) => this.drawSquare({ x, y, size, pattern: toolPattern, color }),
          });
          this.flush();
        }, totalDelay);
        totalDelay += delay;
      }
      // Extra delay between brush strokes so the lines dont appear immediately when the previous ends.
      totalDelay += bigDelay;
    }
    setTimeout(() => {
      this.acceptsInput = true;
      this.updateButtonControls();
    }, totalDelay);
  }
}
