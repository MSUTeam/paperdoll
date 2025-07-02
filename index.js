let yAxis, xAxis, externalContainer, elementSettingsContainer, hideGridCheckbox, spriteCardinals, paperdollPresets;
const XMLMap = new Map()

class Cardinals {
    static textToRect(_text) {
        const ret = {};
        const cards = ["left", "right", "top", "bottom"];
        cards.forEach(element => {
            const rex = new RegExp(`"?${element}"? ?= ?"(-?\\d+)"`);
            const result = _text.match(rex);
            if (result != null)
                ret[element] = parseInt(result[1]);
        });
        return new Cardinals(ret.left, ret.right, ret.top, ret.bottom);
    }
    
    static fromObject(obj) {
        return new Cardinals(obj.left, obj.right, obj.top, obj.bottom);
    }
    
    constructor(left, right, top, bottom) {
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;
    }
    
    parse = (_el) => Math.round(parseFloat(_el));
    
    rectToText() {
        const left = this.left !== undefined ? `left="${this.parse(this.left)}"` : "";
        const right = this.right !== undefined ? ` right="${this.parse(this.right)}"` : "";
        const top = this.top !== undefined ? ` top="${this.parse(this.top)}"` : "";
        const bottom = this.bottom !== undefined ? ` bottom="${this.parse(this.bottom)}"` : "";
        return `${left}${right}${top}${bottom}`;
    }
    
    invertHorizontal() {
        return new Cardinals(
            this.right !== undefined ? this.right * -1 : undefined,
            this.left !== undefined ? this.left * -1 : undefined,
            this.top,
            this.bottom
        );
    }
    
    invertVertical() {
        return new Cardinals(
            this.left,
            this.right,
            this.bottom !== undefined ? this.bottom * -1 : undefined,
            this.top !== undefined ? this.top * -1 : undefined
        );
    }
    
    getCenterOffsets(containerRect) {
        const width = containerRect.width;
        const height = containerRect.height;
        const left = this.left - containerRect.left - (width / 2);
        const right = this.right - containerRect.left - (width / 2);
        const top = this.top - containerRect.top - (height / 2);
        const bottom = this.bottom - containerRect.top - (height / 2);
        return new Cardinals(left, right, -bottom, -top);
    }
}


class Sprite {
    constructor(imgElement, name, spriteManager) {
        this.spriteManager = spriteManager;
        this.isActiveSprite = false;
        this.isSelectedForGrouping = false;

        this.imgElement = imgElement;
        this.name = name;
        this.id = this.generateId(name);
        this.cardinals = new Cardinals();
        
        // Create containers immediately
        this.imgContainer = this.createImageContainer();
        this.defContainer = this.createSettingsContainer();
        
        // Setup the containers
        this.setupContainers();
    }
    remove() {
        if (this.defContainer) {
            this.defContainer.remove();
        }
        if (this.imgContainer) {
            this.imgContainer.remove();
        }
    }

    setOpacity(value) {
        this.imgContainer.style.opacity = value;
        this.imgContainer.style.display = value < 0.01 ? "none" : "block";
    }
    
    setZIndex(value) {
        this.imgContainer.style.zIndex = value;
    }
    
    toggleFlip() {
        const flipCheckbox = this.defContainer.querySelector(".flip-container input");
        flipCheckbox.checked = !flipCheckbox.checked;
        this.imgContainer.classList.toggle("flipped", flipCheckbox.checked);
        const cardinalText = this.defContainer.querySelector(".sprite-def-offset-text");
        const currentCardinals = Cardinals.textToRect(cardinalText.innerHTML);
        const flippedCardinals = currentCardinals.invertHorizontal();
        this.positionWithCardinals(flippedCardinals);
        return flipCheckbox.checked;
    }

    toggleActiveSprite() {
        this.isActiveSprite = !this.isActiveSprite;
        this.imgContainer.classList.toggle("activeElement", this.isActiveSprite);
        this.defContainer.classList.toggle("activeSetting", this.isActiveSprite);
    }

    toggleSelectForGrouping() {
        this.isSelectedForGrouping = !this.isSelectedForGrouping;
        this.imgContainer.classList.toggle("is-selected-for-grouping", this.isSelectedForGrouping);
        this.defContainer.classList.toggle("is-selected-for-grouping", this.isSelectedForGrouping);
    }
    
    generateId(name) {
        let nameSplit;
        let nameSplitBack = name.split("\\");
        let nameSplitFront = name.split("/");
        nameSplit = nameSplitBack.length >= nameSplitFront.length ? nameSplitBack : nameSplitFront;
        return nameSplit[nameSplit.length - 1];
    }
    
    createImageContainer() {
        let div = document.createElement("div");
        div.draggable = true;
        div.classList.add("spriteContainer");
        div.setAttribute("sprite_id", this.id);
        div.addEventListener("click", (event) => {
            event.stopPropagation();
            if (event.ctrlKey) {
                this.toggleSelectForGrouping();
            } else {
                this.spriteManager.setActiveSprite(this);
            }
        });
        div.addEventListener("dragstart", (event) => onDragStart(event));
        return div;
    }
    
    createSettingsContainer() {
        let settingsDiv = this.createSpriteDefContainer();
        settingsDiv.addEventListener("click", (event) => {
            event.stopPropagation();
            if (event.ctrlKey) {
                this.toggleSelectForGrouping();
            } else {
                this.spriteManager.setActiveSprite(this);
            }
        });
        settingsDiv.setAttribute("sprite_id", this.id);

        let name = settingsDiv.querySelector(".sprite-def-name");
        name.innerHTML = this.name;

        const inputContainer = document.createElement("div");
        inputContainer.classList.add("sprite-settings-inputs");
        settingsDiv.append(inputContainer);

        this.addSettingsControls(inputContainer);
        
        return settingsDiv;
    }
    
    createSpriteDefContainer() {
        const template = `
        <div class="sprite-def">
            <div class="sprite-def-name"></div>
            <div class="sprite-def-offset-container">
                <span class="sprite-def-offset-text"></span>
            </div>
        </div>`;
        const parser = new DOMParser();
        const doc = parser.parseFromString(template, "text/html");
        let offsetText = doc.querySelector(".sprite-def-offset-text");
        offsetText.addEventListener("click", (event) => {
            event.stopPropagation();
            navigator.clipboard.writeText(offsetText.innerHTML);
            this.showCopiedFeedback(offsetText);
        });
        return doc.body.firstChild;
    }
    
    showCopiedFeedback(offsetText) {
        const copiedText = document.createElement("span");
        copiedText.textContent = "Copied!";
        copiedText.style.position = "absolute";
        copiedText.style.right = "50px";
        copiedText.style.opacity = "1";
        copiedText.style.transition = "opacity 1s";
        copiedText.style.paddingLeft = "1rem";
    
        offsetText.appendChild(copiedText);
    
        setTimeout(() => {
            copiedText.style.opacity = "0";
            setTimeout(() => {
                copiedText.remove();
            }, 500);
        }, 0);
    }
    
    addSettingsControls(inputContainer) {
        // Opacity slider
        const opacitySliderText = document.createTextNode("Opacity");
        const opacitySlider = document.createElement("input");
        opacitySlider.type = "range";
        opacitySlider.min = 0.00;
        opacitySlider.max = 1.0;
        opacitySlider.value = 1.0;
        opacitySlider.step = 0.01;
        opacitySlider.addEventListener("input", (event) => {
            this.setOpacity(event.target.value);
        });

        // Z-Index control
        let zIndexContainer = document.createElement("div");
        zIndexContainer.classList.add("zIndexContainer");
        let zIndexLabel = document.createElement("span");
        zIndexLabel.innerHTML = "Z-Index";
        zIndexLabel.style.marginLeft = "1rem";
        let zIndex = document.createElement("input");
        zIndex.type = "number";
        zIndex.onclick = (event) => { 
            event.stopPropagation(); 
            this.setZIndex(zIndex.value);
        };
        zIndexContainer.append(zIndexLabel, zIndex);

        // Save button
        let saveButton = document.createElement("button");
        saveButton.innerHTML = "Save as PNG";
        saveButton.addEventListener("click", (event) => {
            event.stopPropagation();
            this.saveAsPNG();
        });

        // Flip control
        let flipContainer = document.createElement("div");
        flipContainer.classList.add("flip-container");
        let flipLabel = document.createElement("span");
        flipLabel.innerHTML = "Flip sprite";
        let flip = document.createElement("input");
        flip.type = "checkbox";
        flip.addEventListener("change", (event) => {
            event.preventDefault();
            event.stopPropagation(); 
            this.toggleFlip();
        });
        flipContainer.append(flipLabel, flip);
        
        inputContainer.append(opacitySliderText, opacitySlider, zIndexContainer, saveButton, flipContainer);
    }
    
    setupContainers() {
        // Add the image to the container
        this.imgContainer.append(this.imgElement);
    }
    
    saveAsPNG() {
        // Create a temporary container
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'relative';
        tempContainer.style.display = 'inline-block';
        const containerRect = this.imgContainer.getBoundingClientRect();
        tempContainer.style.width = containerRect.width + 'px';
        tempContainer.style.height = containerRect.height + 'px';
        
        // Clone the element
        const clonedElement = this.imgContainer.cloneNode(true);
        clonedElement.style.position = 'relative';
        clonedElement.style.top = '';
        clonedElement.style.left = '';
        clonedElement.style.right = '';
        clonedElement.style.bottom = '';
        
        tempContainer.appendChild(clonedElement);
        document.body.appendChild(tempContainer);
        
        domtoimage.toPng(tempContainer, {
            useCORS: true
        })
        .then((dataUrl) => {
            document.body.removeChild(tempContainer);
            let fileName = this.name.split('/');
            fileName = fileName[fileName.length - 1];
            
            var link = document.createElement('a');
            link.download = fileName;
            link.href = dataUrl;
            link.click();
        })
        .catch((error) => {
            console.error('Error generating image:', error);
            document.body.removeChild(tempContainer);
        });
    }
    
    positionWithCardinals(cardinals) {
        const containerRect = externalContainer.getBoundingClientRect();
        const img = this.imgElement;
        
        // either get the cardinals from the preset, or use the img source natural values
        const addLeft = cardinals.left !== undefined ? cardinals.left : -(img.naturalWidth/2);
        const addRight = cardinals.right !== undefined ? cardinals.right * -1 : -(img.naturalWidth/2);
        const addTop = cardinals.bottom !== undefined ? cardinals.bottom * -1 : -(img.naturalHeight/2);
        const addBottom = cardinals.top !== undefined ? cardinals.top : -(img.naturalHeight/2);
        
        const left = (containerRect.width/2) + addLeft;
        const right = (containerRect.width/2) + addRight;
        const top = (containerRect.height/2) + addTop;
        const bottom = (containerRect.height/2) + addBottom;
        
        this.imgContainer.style.left = left + "px";
        this.imgContainer.style.right = right + "px";
        this.imgContainer.style.top = top + "px";
        this.imgContainer.style.bottom = bottom + "px";
        
        this.cardinals = Cardinals.fromObject(cardinals);
        this.updateCardinalText();
    }
    
    updateCardinalText(target = null) {
        const rect = this.imgContainer.getBoundingClientRect();
        const containerRect = externalContainer.getBoundingClientRect();
        const centerOffsets = new Cardinals(
            rect.left - containerRect.left - (containerRect.width / 2),
            rect.right - containerRect.left - (containerRect.width / 2), 
            -(rect.bottom - containerRect.top - (containerRect.height / 2)),
            -(rect.top - containerRect.top - (containerRect.height / 2))
        );
        
        if (target == null)
            target = this.defContainer.querySelector(".sprite-def-offset-text");
        target.innerHTML = centerOffsets.rectToText();
    }
}

class PresetManager {
    constructor(_spriteManager) {
        this.spriteManager = _spriteManager;
        this.presets = {
            "Head" : [
                {
                    "src" : "./assets/head.png",
                    left : -21,
                    right : 29,
                    top: -20,
                    bottom : 48,
                },
            ],
            "Body" : [
                {
                    "src" : "./assets/body.png",
                    top: -48,
                    bottom : 10,
                },
            ],
            "Head Dead" : [
                {
                    "src" : "./assets/head_dead.png",
                    left : -44,
                    right : 16,
                    top: -58,
                    bottom : 0,
                },
            ],
            "Body Dead" : [
                {
                    "src" : "./assets/body_dead.png",
                    left : -65,
                    right : 66,
                    top: -57,
                    bottom : 53,
                },
            ],
            "Tactical Tile" : [
                {
                    "src" : "./assets/tactical_tile.png",
                },
            ],
            "World Tile" : [
                {
                    "src" : "./assets/world_tile.png",
                },
            ],
            "Armored Man": [
                {
                    "src": "./assets/armored_man.png",
                    left: -47,
                    right: 49,
                    top: -70,
                    bottom: 52
                }
            ]
        };
        
        this.presets["Full Body"] = [this.presets["Body"][0], this.presets["Head"][0]];
        this.presets["Full Dead Body"] = [this.presets["Body Dead"][0], this.presets["Head Dead"][0]];
    }
    
    getPreset(key) {
        return this.presets[key];
    }
    
    getAllPresetNames() {
        return Object.keys(this.presets);
    }
    
    loadPreset(key) {
        let preset = this.presets[key];
        preset.forEach(element => {
            loadImage(element.src)
            .then(img => this.spriteManager.addSprite(img, element.src))
            .then(sprite => {
                sprite.positionWithCardinals(element);
            });
        });
    }
}

class SpriteManager {
    constructor() {
        this.sprites = new Map();
        this.orderedSprites = [];
        this.imgContainerToSprite = new WeakMap();
        this.defContainerToSprite = new WeakMap();
        this.presetManager = new PresetManager(this);
        this.activeSprite = null;
    }

    setActiveSprite(_sprite, _removePrevious = true) {  
        if (this.activeSprite) {
            this.activeSprite.toggleActiveSprite();
        }
        if (_sprite === this.activeSprite && _removePrevious) {
            this.activeSprite = null;
            return;
        }
        this.activeSprite = _sprite;
        if (this.activeSprite) {
            this.activeSprite.toggleActiveSprite();
        }
    }

    switchActiveSprite(_idx) {
        // switch active sprite based on index
        if (this.orderedSprites.length === 0) {
            return;
        }
        if (this.activeSprite === null) {
            this.setActiveSprite(_idx == -1 ? this.orderedSprites[0] : this.orderedSprites[this.orderedSprites.length - 1]);
            return this.activeSprite;
        }
        let currentIndex = this.orderedSprites.indexOf(this.activeSprite);
        let newIndex = currentIndex + _idx;
        if (newIndex >= this.orderedSprites.length) {
            newIndex = this.orderedSprites.length - 1;
        } else if (newIndex < 0) {
            newIndex = 0;
        }
        if (newIndex !== currentIndex) {
            this.setActiveSprite(this.orderedSprites[newIndex]);
        }
        return this.activeSprite;
    }

    addSprite(imgElement, name) {
        const sprite = new Sprite(imgElement, name, this);
        
        // Add to DOM
        externalContainer.append(sprite.imgContainer);
        elementSettingsContainer.append(sprite.defContainer);
        
        // Register sprite
        this.sprites.set(sprite.imgContainer, sprite);
        this.orderedSprites.push(sprite);
        this.imgContainerToSprite.set(sprite.imgContainer, sprite);
        this.defContainerToSprite.set(sprite.defContainer, sprite);
        
        this.addObserver(sprite.imgContainer);
        
        // Apply XML cardinals if available
        let cardinals = {};
        if (XMLMap.has(sprite.id))
            cardinals = XMLMap.get(sprite.id);
        sprite.positionWithCardinals(cardinals);
        this.setActiveSprite(sprite);
        return sprite;
    }

    removeSprite(_sprite) {
        if (this.activeSprite === _sprite) {
            this.setActiveSprite(null);
        }
        _sprite.remove();
        this.sprites.delete(_sprite);
        this.orderedSprites = this.orderedSprites.filter(s => s !== _sprite);
    }
    
    addObserver(_div) {
        const config = {attributes : true};
        const callback = function(mutationList, observer){
            const sprite = spriteManager.sprites.get(_div);
            if (sprite) {
                sprite.updateCardinalText();
            }
            observer.disconnect();
            setTimeout(() => observer.observe(_div, config), 0.05);
            return;
        }
        // add observer
        const observer = new MutationObserver(callback);
        observer.observe(_div, config);
        return observer;
    }
}

// Initialize the sprite manager
const spriteManager = new SpriteManager();

document.addEventListener('DOMContentLoaded', function() {
    yAxis = document.getElementById("axis-Y");
    xAxis = document.getElementById("axis-X");
    externalContainer = document.getElementById("externalContainer");
    elementSettingsContainer = document.getElementById("elementSettingsContainer");
    hideGridCheckbox = document.getElementById("hideGridCheckbox");
    spriteCardinals = document.getElementById("spriteCardinals");
    paperdollPresets = document.getElementById("paperdollPresets");

    document.getElementById("spritePositioner").addEventListener("keypress", function(event){
        if (event.key !== 'Enter')
            return;
        handlePassedCardinals();
    });
    
    // Populate presets dropdown
    for (const presetName of spriteManager.presetManager.getAllPresetNames()) {
        const option = document.createElement("option");
        option.value = presetName;
        option.innerHTML = presetName;
        paperdollPresets.append(option);
    }
    
    document.querySelectorAll('input[type=checkbox]').forEach(i => i.checked = false);
    addKeybinds();
}, false);

function addKeybinds() {
    document.addEventListener("keydown",
        (event) => {
            const activeSprite = spriteManager.activeSprite;
            if (event.target === document.getElementById("spritePositioner")) {
                return;
            }
            if (event.ctrlKey) {
                if (event.key === "ArrowRight") {
                    event.preventDefault();
                    spriteManager.switchActiveSprite(1);
                }
                if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    spriteManager.switchActiveSprite(-1);
                }
                if (event.key === "c") {
                    if (activeSprite) {
                        activeSprite.defContainer.querySelector(".sprite-def-offset-text").click();
                    }
                }
                if (event.key === "ArrowUp") {
                    event.preventDefault();
                    if (activeSprite) {
                        const zIndexContainer = activeSprite.defContainer.querySelector(".zIndexContainer input");
                        if (zIndexContainer.value == "") {
                            zIndexContainer.value = 1;
                        } else { 
                            zIndexContainer.value = parseInt(zIndexContainer.value) + 1;
                        }
                        activeSprite.setZIndex(zIndexContainer.value);
                    }
                }
                if (event.key === "ArrowDown") {
                    event.preventDefault();
                    if (activeSprite) {
                        const zIndexContainer = activeSprite.defContainer.querySelector(".zIndexContainer input");
                        if (zIndexContainer.value == "") {
                            zIndexContainer.value = 0;
                        } else { 
                            zIndexContainer.value = parseInt(zIndexContainer.value) - 1;
                        }
                        activeSprite.setZIndex(zIndexContainer.value);
                    }
                }
                return;
            }

            switch (event.key) {
                case "ArrowRight":
                    event.preventDefault();
                    moveImage(1, 0)
                    break;
                case "ArrowLeft":
                    event.preventDefault();
                    moveImage(-1, 0)
                    break;
                case "ArrowUp":
                    event.preventDefault();
                    moveImage(0, -1)
                    break;
                case "ArrowDown":
                    event.preventDefault();
                    moveImage(0, 1)
                    break;
                case "Delete":
                    if (activeSprite) {
                        spriteManager.removeSprite(activeSprite);
                    }
                    break;
                case "f":
                    if (activeSprite) {
                        activeSprite.toggleFlip();
                    }
                    break;
                case "o":
                    if (activeSprite) {
                        const opacitySlider = activeSprite.defContainer.querySelector("input[type=range]");
                        if (opacitySlider.value == 1.0) {
                            opacitySlider.value = 0.0;
                        } else {
                            opacitySlider.value = 1.0;
                        }
                        activeSprite.setOpacity(opacitySlider.value);
                    }
            }
        },
        true,
    );
}

function handlePassedCardinals() {
    const text = document.getElementById("spritePositioner").value;
    const cardinals = Cardinals.textToRect(text);
    if (spriteManager.activeSprite) {
        spriteManager.activeSprite.positionWithCardinals(cardinals);
    }
}

function groupSprites() {
    const selectedSpritesForGrouping = spriteManager.orderedSprites.filter(sprite => sprite.isSelectedForGrouping);
    if (selectedSpritesForGrouping.length < 2) {
        alert("Please select at least two elements to group.");
        return;
    }
    const selectedSpriteIDs = selectedSpritesForGrouping.map(sprite => sprite.id);
    const mergedSpriteName = selectedSpriteIDs.join("_");
    const selectedImageContainers = selectedSpritesForGrouping.map(sprite => sprite.imgContainer);
    const selectedSettingDefs = selectedSpritesForGrouping.map(sprite => sprite.defContainer);

    let rect = {};
    selectedSettingDefs.forEach(settingDef => {
        let settingRect = Cardinals.textToRect(settingDef.querySelector(".sprite-def-offset-text").innerHTML);
        if (rect.left === undefined || settingRect.left < rect.left) {
            rect.left = settingRect.left;
        }
        if (rect.right === undefined || settingRect.right > rect.right) {
            rect.right = settingRect.right;
        }
        if (rect.top === undefined || settingRect.top < rect.top) {
            rect.top = settingRect.top;
        }
        if (rect.bottom === undefined || settingRect.bottom > rect.bottom) {
            rect.bottom = settingRect.bottom;
        }
    });

    const groupImage = document.createElement("img");
    groupImage.classList.add("spriteImg");
    const mergeDefs = [...selectedSpritesForGrouping].map(sprite => {
        return {
            src: sprite.imgElement.src,
            x: sprite.cardinals.left !== undefined ? sprite.cardinals.left : 0,
            y: sprite.cardinals.bottom !== undefined ? sprite.cardinals.bottom  : 0
        };
    });
    mergeImages(mergeDefs)
        .then(b64 => groupImage.src = b64)
        .then(function () {
            const sprite = spriteManager.addSprite(groupImage, mergedSpriteName);
            sprite.positionWithCardinals(rect);
        });
}

function loadImage(_src) {
    return new Promise(resolve => {
        let img = document.createElement("img");
        img.classList.add("spriteImg");
        img.onload = () => resolve(img);
        img.src = _src;
    });
}

function loadPresetDummy(_key) {
    spriteManager.presetManager.loadPreset(_key);
}

function loadFile(ev) {
    let tgt = ev.target,
        files = tgt.files;
    if (FileReader && files && files.length) {
        for (let x = 0; x < files.length; x++) {
            let fr = new FileReader();
            fr.onload = function () {
                loadImage(fr.result)
                .then(img => spriteManager.addSprite(img, files[x].name));
            }
            fr.readAsDataURL(files[x]);
        }
    }
}

function loadXMLFile(ev) {
    let tgt = ev.target,
        files = tgt.files;
    if (FileReader && files && files.length) {
        for (let x = 0; x < files.length; x++) {
            let fr = new FileReader();
            let parser = new DOMParser();
            fr.onload = function () {
                const group = {
                    name: files[x].name,
                    spriteDefs: {},
                };
                const doc = parser.parseFromString(fr.result, "text/xml");
                const header = doc.querySelector("brush");
                if (header != null) {
                    const headerName = header.getAttribute("name");
                    if (headerName != null && headerName.length > 0) {
                        group.name += " - " + headerName;
                    }
                }
                const sprites = doc.getElementsByTagName("sprite");
                for (let y = 0; y < sprites.length; y++) {
                    const sprite = sprites[y];
                    let img = sprite.getAttribute("img");
                    let nameSplit;
                    let nameSplitBack = img.split("\\");
                    let nameSplitFront = img.split("/");
                    nameSplit = nameSplitBack.length >= nameSplitFront.length ? nameSplitBack : nameSplitFront;
                    img = nameSplit[nameSplit.length - 1];
                    const cardinals = new Cardinals(
                        parseInt(sprite.getAttribute("left")) || undefined,
                        parseInt(sprite.getAttribute("right")) || undefined,
                        parseInt(sprite.getAttribute("top")) || undefined,
                        parseInt(sprite.getAttribute("bottom")) || undefined
                    );
                    group.spriteDefs[img] = cardinals;
                    spriteManager.sprites.forEach((sprite, key) => {
                        if (key.getAttribute("sprite_id") == img) {
                            sprite.positionWithCardinals(cardinals);
                            return false;
                        }
                    });
                }
                addXMLGroup(group);
            }
            fr.readAsText(files[x]);
        }
    }
}

function addXMLGroup(group) {
    let groupContainer = document.createElement("div");
    groupContainer.classList.add("xmlGroup");
    groupContainer.innerHTML = `<h4>${group.name}</h4>`;
    let groupSpriteDefContainer = document.createElement("div");
    groupSpriteDefContainer.classList.add("xmlGroupSpriteDefContainer");
    groupContainer.append(groupSpriteDefContainer);
    groupContainer.addEventListener("click", (event) => {
        event.stopPropagation();
        if (groupSpriteDefContainer.style.display == "none") {
            groupSpriteDefContainer.style.display = "block";
        } else {
            groupSpriteDefContainer.style.display = "none";
        }
    });
    for (const [key, element] of Object.entries(group.spriteDefs)) {
        XMLMap.set(key, element);
        let spriteDef = spriteManager.createSpriteDefContainer();
        spriteDef.querySelector(".sprite-def-name").innerHTML = key;
        spriteDef.querySelector(".sprite-def-offset-text").innerHTML = element.rectToText();
        groupSpriteDefContainer.append(spriteDef);
    };
    document.querySelector("#xmlUploadContainer").append(groupContainer);
}

// Keep existing drag and positioning functions
let previousX;
let previousY
let offsetX;
let offsetY;

function onDragStart(ev) {
    const imgContainer = ev.currentTarget;
    spriteManager.setActiveSprite(spriteManager.imgContainerToSprite.get(imgContainer), false);
    const rect = imgContainer.getBoundingClientRect();
    previousX = ev.clientX;
    previousY = ev.clientY;
    offsetX = ev.clientX - rect.x;
    offsetY = ev.clientY - rect.y;
}

function dragover_handler(ev) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
}

function drop_handler(ev) {
    ev.preventDefault();
    if (ev.dataTransfer && ev.dataTransfer.files.length > 0) {
        [...ev.dataTransfer.files].forEach((file, i) => {
            let fr = new FileReader();
            fr.onload = function () {
                loadImage(fr.result)
                .then(img => spriteManager.addSprite(img, file.name));
            }
            fr.readAsDataURL(file);
        });
        return;
    }

    const left = ev.clientX - previousX;
    const top = ev.clientY - previousY;
    moveImage(left, top);
}

function moveImage(x=0, y=0) {
    const activeSprite = spriteManager.activeSprite;
    if (!activeSprite) return;
    const activeElement = activeSprite.imgContainer;
    
    const boundingRect = externalContainer.getBoundingClientRect();
    activeElement.style.right = `${boundingRect.width - activeElement.offsetLeft - activeElement.offsetWidth - x}px`;
    activeElement.style.bottom = `${boundingRect.height - activeElement.offsetTop - activeElement.offsetHeight - y}px`;
    activeElement.style.left = `${activeElement.offsetLeft + x}px`;
    activeElement.style.top = `${activeElement.offsetTop + y}px`;
}

function toggleBackground(_) {
    let checkbox = document.querySelector("#toggleBackgroundCheckbox");
    if (checkbox.checked) {
        externalContainer.classList.add("backgroundVisible");
    } else {
        externalContainer.classList.remove("backgroundVisible");
    }    
}

function toggleGrid(_) {
    externalContainer.setAttribute("showgrid", !hideGridCheckbox.checked);
}

function toggleSize(_) {
    let size = toggleSizeCheckbox.checked ? 200 : 400;
    externalContainer.style.width = size + "px";
    externalContainer.style.height = size + "px";
    yAxis.style.left = size / 2 + "px";
    xAxis.style.top = size / 2 + "px";
}

function saveAsImg(ev) {
    domtoimage.toPng(externalContainer)
    .then(function (dataUrl) {
        var link = document.createElement('a');
        link.download = "paperdoll_" + Date.now() + ".png";
        link.href = dataUrl;
        link.click();
    });
}
