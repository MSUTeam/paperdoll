let yAxis, xAxis, externalContainer, elementSettingsContainer, hideGridCheckbox, spriteCardinals, paperdollPresets;
const XMLMap = new Map()


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
            "Tactical Bust" : [
                {
                    "src": "./assets/bust_base_player.png",
                    left : -49,
                    right : 51,
                    top: -71,
                    bottom : -5,
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
            .then(img => {
                const sprite = this.spriteManager.addSprite(img, element.src);
                sprite.positionWithCardinals(element);
            })
        });
    }
}

class Cardinals {
    static fromText(_text) {
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
        this.observer = this.addSpriteContainerObserver();
        this.defContainer = this.createSettingsContainer();
        this.offsetTextContainer = this.defContainer.querySelector(".sprite-def-offset-text");
        
        // Setup the containers1
        this.setupContainers();
    }

    addSpriteContainerObserver() {
        const config = {attributes : true};
        const callback = (mutationList, observer) =>{
            this.updateCardinalText();
            observer.disconnect();
            setTimeout(() => observer.observe(this.imgContainer, config), 0.05);
            return;
        }
        // add observer
        const observer = new MutationObserver(callback);
        observer.observe(this.imgContainer, config);
        return observer;
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
    
    toggleFlipCheckbox() {
        const flipCheckbox = this.defContainer.querySelector(".flip-container input");
        flipCheckbox.checked = !flipCheckbox.checked;
        return flipCheckbox.checked;
    }

    onFlip() {
        const flipCheckbox = this.defContainer.querySelector(".flip-container input");
        this.imgContainer.classList.toggle("flipped", flipCheckbox.checked);
        const currentCardinals = this.textToCardinals();
        const flippedCardinals = currentCardinals.invertHorizontal();
        this.positionWithCardinals(flippedCardinals);
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
        this.spriteManager.onSpriteSelectForGrouping(this);
    }
    
    generateId(name) {
        let nameSplit;
        let nameSplitBack = name.split("\\");
        let nameSplitFront = name.split("/");
        nameSplit = nameSplitBack.length >= nameSplitFront.length ? nameSplitBack : nameSplitFront;
        return nameSplit[nameSplit.length - 1];
    }

    getOffsetText() {
        return this.offsetTextContainer.innerHTML;
    }

    textToCardinals() {
        const text = this.getOffsetText();
        return Cardinals.fromText(text);
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
        let settingsDiv = Sprite.createSpriteDefContainer();
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
    
    static createSpriteDefContainer() {
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
        });
        return doc.body.firstChild;
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
            event.stopPropagation(); 
            this.onFlip();
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
        const addLeft = cardinals.left !== undefined ? cardinals.left : -(img.naturalWidth / 2);
        const addRight = cardinals.right !== undefined ? cardinals.right * -1 : -(img.naturalWidth / 2);
        const addTop = cardinals.bottom !== undefined ? cardinals.bottom * -1 : -(img.naturalHeight / 2);
        const addBottom = cardinals.top !== undefined ? cardinals.top : -(img.naturalHeight / 2);
        
        const left = (containerRect.width / 2) + addLeft;
        const right = (containerRect.width / 2) + addRight;
        const top = (containerRect.height / 2) + addTop;
        const bottom = (containerRect.height / 2) + addBottom;
        
        this.imgContainer.style.left = left + "px";
        this.imgContainer.style.right = right + "px";
        this.imgContainer.style.top = top + "px";
        this.imgContainer.style.bottom = bottom + "px";
        
        this.cardinals = Cardinals.fromObject({left, right, top, bottom});
        this.updateCardinalText();
    }
    
    updateCardinalText() {
        const rect = this.imgContainer.getBoundingClientRect();
        const containerRect = externalContainer.getBoundingClientRect();
        const centerOffsets = new Cardinals(
            rect.left - containerRect.left - (containerRect.width / 2),
            rect.right - containerRect.left - (containerRect.width / 2), 
            -(rect.bottom - containerRect.top - (containerRect.height / 2)),
            -(rect.top - containerRect.top - (containerRect.height / 2))
        );
        this.offsetTextContainer.innerHTML = centerOffsets.rectToText();
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
        this.orderedSprites.push(sprite);
        this.imgContainerToSprite.set(sprite.imgContainer, sprite);
        this.defContainerToSprite.set(sprite.defContainer, sprite);
        
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
        this.orderedSprites = this.orderedSprites.filter(s => s !== _sprite);
    }

    onSpriteSelectForGrouping(_sprite) {
        const groupedElements = this.orderedSprites.filter(sprite => sprite.isSelectedForGrouping);
        const groupButton = document.getElementById("groupSpritesButton");
        if (groupedElements.length < 2) {
            groupButton.disabled = true;
            groupButton.value = "Group Sprites";
        }
        else {
            groupButton.disabled = false;
            groupButton.value = `Group Sprites (${groupedElements.length})`;
        }
    }
}

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
                        activeSprite.offsetTextContainer.click();
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
                        activeSprite.toggleFlipCheckbox();
                        activeSprite.onFlip();
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
    const cardinals = Cardinals.fromText(text);
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

    // Calculate the bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let newLeft, newRight, newTop, newBottom;
    let offsetTop = -Infinity, offsetLeft = -Infinity;
    selectedSpritesForGrouping.map(sprite => {
        const cardinals = sprite.textToCardinals();
        if (newLeft === undefined || cardinals.left < newLeft) { 
            newLeft = cardinals.left;
        }
        if (newRight === undefined || cardinals.right > newRight) {
            newRight = cardinals.right;
        }
        if (newTop === undefined || cardinals.top < newTop) {
            newTop = cardinals.top;
        }
        if (newBottom === undefined || cardinals.bottom > newBottom) {
            newBottom = cardinals.bottom;
        }

        const boundingRect = sprite.imgElement.getBoundingClientRect();
        if (boundingRect.top < offsetTop || offsetTop === -Infinity) {
            offsetTop = boundingRect.top;
        }
        if (boundingRect.left < offsetLeft || offsetLeft === -Infinity) {
            offsetLeft = boundingRect.left;
        }

        const centerX = (cardinals.left + cardinals.right) / 2;
        const centerY = (cardinals.top + cardinals.bottom) / 2;
        const imgWidth = sprite.imgElement.naturalWidth;
        const imgHeight = sprite.imgElement.naturalHeight;
        const left = centerX - imgWidth / 2;
        const top = centerY - imgHeight / 2;
        
        minX = Math.min(minX, left);
        minY = Math.min(minY, top);
        maxX = Math.max(maxX, left + imgWidth);
        maxY = Math.max(maxY, top + imgHeight);
        
    });
    const canvasWidth = maxX - minX;
    const canvasHeight = maxY - minY;
    
    const mergeDefs = selectedSpritesForGrouping.map(sprite => {
        const boundingRect = sprite.imgElement.getBoundingClientRect();
        const y = boundingRect.top - offsetTop;
        const x = boundingRect.left -  offsetLeft;
        
        // Update bounds

        return {
            src: sprite.imgElement.src,
            x: x,
            y: y,
            z_index : parseInt(window.getComputedStyle(sprite.imgContainer).zIndex) || 0,
        };
    });
    sortedMergeDefs = mergeDefs.sort((a, b) => {
        return a.z_index - b.z_index;
    });

    mergeImages(sortedMergeDefs, {
        width: canvasWidth,
        height: canvasHeight
    })
    .then(b64 => {
        const groupImage = document.createElement("img");
        groupImage.classList.add("spriteImg");
        groupImage.src = b64;
        groupImage.onload = () => {
            // merge sprite names, stripping file extensions, adding .png at the end
            const mergedSpriteName = selectedSpritesForGrouping.map(sprite => sprite.id.replace(/\..+/g, "")).join("_") + ".png";
            const sprite = spriteManager.addSprite(groupImage, mergedSpriteName);
            sprite.positionWithCardinals(new Cardinals(left = newLeft, right = newRight, top = newTop, bottom = newBottom));
            if (document.getElementById("deleteGroupedSpritesCheckbox").checked) {
                selectedSpritesForGrouping.forEach(sprite => {
                    spriteManager.removeSprite(sprite);
                });
            }
        };
    });
}

function copyMetadata() {
    const selectedSpritesForGrouping = spriteManager.orderedSprites.filter(sprite => sprite.isSelectedForGrouping || sprite.isActiveSprite);
    if (selectedSpritesForGrouping.length === 0) {
        alert("Please select at least one element to copy metadata.");
        return;
    };
    let outputString = "";
    selectedSpritesForGrouping.forEach(sprite => {
        const cardinals = sprite.textToCardinals();
        outputString += `<sprite id="${sprite.id}" img="${sprite.id}" ${cardinals.rectToText()}/>\n`;
    });
    navigator.clipboard.writeText(outputString);
    if (document.getElementById("deleteCopyMetadataCheckbox").checked) {
        selectedSpritesForGrouping.forEach(sprite => {
            spriteManager.removeSprite(sprite);
        });
    }   
    const copiedText = document.createElement("span");
    copiedText.textContent = "Copied!";
    copiedText.style.position = "absolute";
    copiedText.style.right = "50px";
    copiedText.style.opacity = "1";
    copiedText.style.transition = "opacity 1s";
    copiedText.style.paddingLeft = "1rem";
    
    const elementSettingsContainer = document.getElementById("elementSettingsContainer");
    elementSettingsContainer.parentNode.insertBefore(copiedText, elementSettingsContainer);
    setTimeout(() => {
        copiedText.style.transition = "opacity 0.5s ease-out";
        copiedText.style.opacity = "0";
        setTimeout(() => {
            copiedText.remove();
        }, 500);
    }, 1000);
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
                const spriteDefs = doc.getElementsByTagName("sprite");
                for (let y = 0; y < spriteDefs.length; y++) {
                    const spriteDef = spriteDefs[y];
                    let filePath = spriteDef.getAttribute("img");
                    let nameSplit;
                    let nameSplitBack = filePath.split("\\");
                    let nameSplitFront = filePath.split("/");
                    nameSplit = nameSplitBack.length >= nameSplitFront.length ? nameSplitBack : nameSplitFront;
                    fileName = nameSplit[nameSplit.length - 1];
                    const cardinals = new Cardinals(
                        parseInt(spriteDef.getAttribute("left")) || undefined,
                        parseInt(spriteDef.getAttribute("right")) || undefined,
                        parseInt(spriteDef.getAttribute("top")) || undefined,
                        parseInt(spriteDef.getAttribute("bottom")) || undefined
                    );
                    group.spriteDefs[fileName] = cardinals;
                    spriteManager.orderedSprites.forEach((sprite, _) => {
                        if (sprite.id == fileName) {
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
        let spriteDef = Sprite.createSpriteDefContainer();
        spriteDef.querySelector(".sprite-def-name").innerHTML = key;
        spriteDef.querySelector(".sprite-def-offset-text").innerHTML = element.rectToText();
        groupSpriteDefContainer.append(spriteDef);
    };
    document.querySelector("#xmlUploadContainer").append(groupContainer);
}

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

function moveImage(x = 0, y = 0) {
    const activeSprite = spriteManager.activeSprite;
    if (!activeSprite) return;
    if (activeSprite.imgContainer.style.display === "none") {
        // If we move it now it will bug out -> avoid moving invisible elements
        return;
    }
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
