let activeElement, yAxis, xAxis, externalContainer, elementSettingsContainer, hideGridCheckbox, spriteCardinals, paperdollPresets;
const spriteMap = new Map()
const XMLMap = new Map()
let presets = {
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
    ]
}
presets["Full Body"] = [presets["Body"][0], presets["Head"][0]];
presets["Full Dead Body"] = [presets["Body Dead"][0], presets["Head Dead"][0]];

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
    })
    for (const [key, value] of Object.entries(presets))
    {
        const option = document.createElement("option");
        option.value = key;
        option.innerHTML = key;
        paperdollPresets.append(option);
    }
    document.querySelectorAll('input[type=checkbox]').forEach(i => i.checked = false);
}, false);

function loadImage(_src)
{
    return new Promise(resolve => {
        let img = document.createElement("img");
        img.classList.add("spriteImg");
        img.onload = () => resolve(img);
        img.src = _src;
    });
}

function addSprite(_img, _name)
{
    const container = createNewImageContainer();
    container.append(_img)
    externalContainer.append(container);
    let nameSplit;
    let nameSplitBack = _name.split("\\");
    let nameSplitFront = _name.split("/");
    nameSplit = nameSplitBack.length >= nameSplitFront.length ? nameSplitBack : nameSplitFront;
    let nameStem = nameSplit[nameSplit.length - 1];
    container.setAttribute("sprite_id", nameStem);

    const settingsDiv = createNewImageSettingsContainer(container, _name)
    elementSettingsContainer.append(settingsDiv)
    spriteMap.set(container, settingsDiv);

    addObserver(container);
    setActiveElement(container);
    let cardinals = {};
    if (XMLMap.has(nameStem))
        cardinals = XMLMap.get(nameStem);
    positionWithCardinals(container, cardinals);
    return container;
}

function createNewImageContainer(_src)
{
    let div = document.createElement("div");
    div.draggable = true;
    div.classList.add("spriteContainer");
    div.addEventListener("click", (event) => setActiveElement(div));
    div.addEventListener("dragstart", (event) => onDragStart(event));
    return div;
}

function createNewImageSettingsContainer(container, _name)
{
    let settingsDiv = document.createElement("div");
    settingsDiv.classList.add("spriteSetting");
    settingsDiv.addEventListener("click", (event) => { event.stopPropagation(); setActiveElement(container)})

    let name = document.createElement("div");
    name.innerHTML = _name;
    name.classList.add("spriteSettingsName")

    let offsetContainer = document.createElement("div");
    let offsetText = document.createElement("span");
    offsetText.classList.add("spriteOffsetText");
    offsetContainer.append(offsetText);
    offsetText.addEventListener("click", (event) => {
        event.stopPropagation();
        navigator.clipboard.writeText(offsetText.innerHTML);
        const copiedText = document.createElement("span");
        copiedText.textContent = "Copied!";
        copiedText.style.opacity = "1";
        copiedText.style.transition = "opacity 1s";
        copiedText.style.paddingLeft = "1rem"

        offsetContainer.appendChild(copiedText);
    
        setTimeout(() => {
            copiedText.style.opacity = "0";
            setTimeout(() => {
                copiedText.remove();
            }, 1500);
        }, 0);
    })

    const inputContainer = document.createElement("div");
    inputContainer.style.display = "flex";

    const opacitySliderText = document.createTextNode("Opacity");
    const opacitySlider = document.createElement("input");
    opacitySlider.type = "range";
    opacitySlider.min = 0.00;
    opacitySlider.max = 1.0;
    opacitySlider.value = 1.0;
    opacitySlider.step = 0.01;
    opacitySlider.addEventListener("input", function(event){
        container.style.opacity = this.value;
        if (this.value < 0.01)
            container.style.display = "none";
        else
            container.style.display = "block";
    })
    let zIndexLabel = document.createElement("span");
    zIndexLabel.innerHTML = "Z-Index";
    zIndexLabel.style.marginLeft = "1rem";
    let zIndex = document.createElement("input");
    zIndex.type = "number";
    zIndex.onclick = (event) => { event.stopPropagation(); container.style.zIndex = zIndex.value };

    inputContainer.append(opacitySliderText, opacitySlider, zIndexLabel, zIndex)
    
    settingsDiv.append(name, offsetContainer, inputContainer);
    return settingsDiv;
}

function addObserver(_div)
{
    const config = {attributes : true};
    const callback = function(mutationList, observer){
        updateCardinalText(_div);
        observer.disconnect();
        setTimeout(() => observer.observe(_div, config), 0.05)
        return;
    }
    // add observer
    const observer = new MutationObserver(callback);
    observer.observe(_div, config);
    return observer;
}

function loadPresetDummy(_key)
{
    let preset = presets[_key];
    preset.forEach(element => {
        loadImage(element.src)
        .then(img => addSprite(img, element.src))
        .then(container => positionWithCardinals(container, element))
    });
}

function handlePassedCardinals()
{
    const ret = {};
    const text = document.getElementById("spritePositioner").value;
    const cards = ["left", "right", "top", "bottom"];
    cards.forEach(element => {
        const rex = new RegExp(`"?${element}"? ?= ?"(-?\\d+)"`);
        const result = text.match(rex);
        if (result != null)
            ret[element] = parseInt(result[1]);
    });
    positionWithCardinals(activeElement, ret);
}

function positionWithCardinals(_element, _cardinals)
{
    const img = _element.querySelector("img");
    const containerRect = externalContainer.getBoundingClientRect();
    // either get the cardinals from the preset, or use the img source natural values
    const addLeft =     _cardinals.left !== undefined ?   _cardinals.left  : -(img.naturalWidth/2);
    const addRight =    _cardinals.right !== undefined ? -_cardinals.right : -(img.naturalWidth/2);
    const addTop =      _cardinals.bottom !== undefined ? -_cardinals.bottom : -(img.naturalHeight/2);
    const addBottom =   _cardinals.top   !== undefined ?  _cardinals.top :  -(img.naturalHeight/2);
    const left =    (containerRect.width/2)  + addLeft;
    const right =   (containerRect.width/2)  + addRight;
    const top =     (containerRect.height/2) + addTop;
    const bottom =  (containerRect.height/2) + addBottom;
    _element.style.left =     (left)  + "px";
    _element.style.right =    (right)  + "px";
    _element.style.top =      (top) + "px";
    _element.style.bottom =   (bottom)  + "px";
    updateCardinalText(_element);
}
function loadFile(ev)
{
    let tgt = ev.target,
        files = tgt.files;
    if (FileReader && files && files.length) {
        for (let x = 0; x < files.length; x++)
        {
            let fr = new FileReader();
            fr.onload = function () {
                loadImage(fr.result)
                .then(img => addSprite(img, files[x].name))
            }
            fr.readAsDataURL(files[x]);
        }
    }
}
function loadXMLFile(ev)
{
    let tgt = ev.target,
        files = tgt.files;
    if (FileReader && files && files.length) {
        for (let x = 0; x < files.length; x++) {
            let fr = new FileReader();
            let parser = new DOMParser();
            fr.onload = function () {
                const doc = parser.parseFromString(fr.result, "text/xml");
                const sprites = doc.getElementsByTagName("sprite");
                for (let y = 0; y < sprites.length; y++)
                {
                    const sprite = sprites[y];
                    let img = sprite.getAttribute("img");
                    let nameSplit;
                    let nameSplitBack = img.split("\\");
                    let nameSplitFront = img.split("/");
                    nameSplit = nameSplitBack.length >= nameSplitFront.length ? nameSplitBack : nameSplitFront;
                    img = nameSplit[nameSplit.length - 1];
                    const cardinals = {
                        img: img,
                        left: parseInt(sprite.getAttribute("left")),
                        right: parseInt(sprite.getAttribute("right")),
                        top: parseInt(sprite.getAttribute("top")),
                        bottom: parseInt(sprite.getAttribute("bottom")),
                    }
                    if (isNaN(cardinals.left)) cardinals.left = undefined;
                    if (isNaN(cardinals.right)) cardinals.right = undefined;
                    if (isNaN(cardinals.top)) cardinals.top = undefined;
                    if (isNaN(cardinals.bottom)) cardinals.bottom = undefined;
                    XMLMap.set(img, cardinals);
                    spriteMap.forEach((_value, key) => {
                        if (key.getAttribute("sprite_id") == img)
                        {
                            positionWithCardinals(key, cardinals);
                            return false;
                        }
                    })
                }
                updateXmlSettings();
            }
            fr.readAsText(files[x]);
        }
    }
}

function updateXmlSettings()
{
    let settingsContainer = document.querySelector("#xmlUploadContainer");
    settingsContainer.innerHTML = "";
    XMLMap.forEach((value, key) => {
        let entry = document.createElement("div");
        entry.innerHTML = "<b>" + value.img + "</b>:";
        if (value.left != undefined) entry.innerHTML += ` left: "${value.left}"`;
        if (value.right != undefined) entry.innerHTML += ` right: "${value.right}"`;
        if (value.top != undefined) entry.innerHTML += ` top: "${value.top}"`;
        if (value.bottom != undefined) entry.innerHTML += ` bottom: "${value.bottom}"`;
        settingsContainer.append(entry);
    })
}
let previousX;
let previousY
let offsetX;
let offsetY;

function onDragStart(ev){
    setActiveElement(ev.currentTarget)
    const rect = activeElement.getBoundingClientRect();
    previousX = ev.clientX;
    previousY = ev.clientY;
    offsetX = ev.clientX - rect.x;
    offsetY = ev.clientY - rect.y;
}

function dragover_handler(ev) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
};

function drop_handler(ev) {
    ev.preventDefault();
    if (ev.dataTransfer && ev.dataTransfer.files.length > 0) {
        [...ev.dataTransfer.files].forEach((file, i) => {
            let fr = new FileReader();
            fr.onload = function () {
                loadImage(fr.result)
                .then(img => addSprite(img, file.name))
            }
            fr.readAsDataURL(file);
        });
        return;
    }

    const left = ev.clientX - previousX;
    const top = ev.clientY - previousY;
    moveImage(left, top)
}

function moveImage(x=0, y=0)
{
    const boundingRect = externalContainer.getBoundingClientRect();
    activeElement.style.right = `${boundingRect.width - activeElement.offsetLeft - activeElement.offsetWidth - x}px`;
    activeElement.style.bottom = `${boundingRect.height - activeElement.offsetTop - activeElement.offsetHeight - y}px`;
    activeElement.style.left = `${activeElement.offsetLeft + x}px`;
    activeElement.style.top = `${activeElement.offsetTop + y}px`;
}

function setActiveElement(_elem)
{
    if (activeElement)
    {
        spriteMap.get(activeElement).classList.remove("activeSetting");
        activeElement.classList.remove("activeElement");
    }
    activeElement = _elem;
    activeElement.classList.add("activeElement");
    spriteMap.get(activeElement).classList.add("activeSetting");
}

function toggleBackground(_)
{
    let checkbox = document.querySelector("#toggleBackgroundCheckbox");
    if (checkbox.checked)
    {
        externalContainer.classList.add("backgroundVisible");
    }
    else
    {
        externalContainer.classList.remove("backgroundVisible");
    }    
}

function toggleGrid(_)
{
    externalContainer.setAttribute("showgrid", !hideGridCheckbox.checked);
}

function toggleSize(_)
{
    let size = toggleSizeCheckbox.checked ? 200 : 400;
    externalContainer.style.width =  size + "px";
    externalContainer.style.height = size + "px";
    yAxis.style.left = size / 2 + "px";
    xAxis.style.top = size / 2 + "px";
}

function getCenterOffsets(_element)
{
    const yRect = yAxis.getBoundingClientRect();
    const xRect = xAxis.getBoundingClientRect();
    const left =  _element.left     - yRect.left;
    const right =  _element.right   - yRect.left;
    const top = _element.top     - xRect.top;
    const bottom = _element.bottom     - xRect.top;
    return {left:left, right:right, top:-bottom, bottom:-top}
}

function updateCardinalText(el, target = null)
{
    const rect = getCenterOffsets(el.getBoundingClientRect());
    const parse = (_el) => Math.round(parseFloat(_el));
    if (target == null)
        target = spriteMap.get(el).querySelector(".spriteOffsetText");
    target.innerHTML = `left: "${parse(rect.left)}" right: "${parse(rect.right)}" top: "${parse(rect.top)}" bottom: "${parse(rect.bottom)}"`;
}

document.addEventListener( "keydown",
    (event) => {
        if(event.target === document.getElementById("spritePositioner")){
            return;
         }
     switch (event.key)
     {
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
            if (activeElement)
            {
                spriteMap.get(activeElement).remove();
                activeElement.remove();
                activeElement = null;
            }
            break;
     }
    },
    true,
);

function saveAsImg(ev)
{
    domtoimage.toPng(externalContainer)
    .then(function (dataUrl) {
        var link = document.createElement('a');
        link.download = "paperdoll_" + Date.now() + ".png";
        link.href = dataUrl;
        link.click();
    });
}