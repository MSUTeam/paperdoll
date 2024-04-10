let showGrid = true;
let activeElement, yAxis, xAxis, externalContainer, elementSettingsContainer, hideGridCheckbox, spriteCardinals, paperdollPresets;
const spriteMap = new Map()

let presets = {
    "Head" : [
        {
            "src" : "head.png",
            left : -21,
            top: -20,
            right : 29,
            bottom : 48,
        },
    ],
    "Body" : [
        {
            "src" : "body.png",
            top: -48,
            bottom : 10,
        },
    ],
    "Tactical Tile" : [
        {
            "src" : "tactical_tile.png",
        },
    ],
    "World Tile" : [
        {
            "src" : "world_tile.png",
        },
    ]
}
presets["Full Body"] = [presets["Body"][0], presets["Head"][0]];

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

    
    toggleGrid();
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

    let settingsDiv = document.createElement("div");
    settingsDiv.classList.add("spriteSetting");
    settingsDiv.addEventListener("click", (event) => {event.stopPropagation(); toggleElement(container, name)})
    elementSettingsContainer.append(settingsDiv);

    let offsetText = document.createElement("div");
    offsetText.classList.add("spriteOffsetText");
    settingsDiv.append(offsetText);
    offsetText.addEventListener("click", (event) => {event.stopPropagation();navigator.clipboard.writeText(offsetText.innerHTML)})
    
    let nameLabel = document.createElement("div");
    nameLabel.innerHTML = "Click box to hide element";
    settingsDiv.append(nameLabel);
    let name = document.createElement("span");
    name.classList.add("settingsNameContainer");
    name.innerHTML = _name;
    settingsDiv.append(name);

    let zIndexLabel = document.createElement("div");
    zIndexLabel.innerHTML="Z-Index";
    settingsDiv.append(zIndexLabel);
    let zIndex = document.createElement("input");
    zIndex.type = "number";
    zIndex.onclick = (event) => {event.stopPropagation(); container.style.zIndex = zIndex.value};
    settingsDiv.append(zIndex);

    spriteMap.set(container, settingsDiv);

    setActiveElement(container);
    positionWithCardinals(container, {});
    return container;
}

function createNewImageContainer(_src)
{
    let div = document.createElement("div");
    div.draggable = true;
    div.classList.add("spriteContainer");
    if (!hideGridCheckbox.checked)
        div.classList.add("showgrid");
    div.addEventListener("click", (event) => setActiveElement(div));
    div.addEventListener("dragstart", (event) => onDragStart(event));
    addObserver(div);
    return div;
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
    const left =    (containerRect.width/2)       + (_cardinals.left    || -(img.naturalWidth/2));
    const right =   (containerRect.width/2)       + (-_cardinals.right  || -(img.naturalWidth/2));
    const top =     (containerRect.height/2)      + (-_cardinals.bottom || -(img.naturalHeight/2));
    const bottom =  (containerRect.height/2)      + (_cardinals.top     || -(img.naturalHeight/2));
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
        let fr = new FileReader();
        fr.onload = function () {
            loadImage(fr.result)
            .then(img => addSprite(img, files[0].name))
        }
        fr.readAsDataURL(files[0]);
    }
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

function toggleElement(_obj, _name)
{
    _obj.style.display = _obj.style.display == "none" ? "block" : "none";
    _name.style.color = _name.style.color == "red" ? "black" : "red";
}

function toggleGrid(event)
{
    var checked = hideGridCheckbox.checked;
    if (!checked)
    {
        yAxis.classList.add("showgrid");
        xAxis.classList.add("showgrid");
        document.querySelectorAll(".spriteContainer").forEach(element => {
            element.classList.add("showgrid");
        });
    }
    else
    {
        yAxis.classList.remove("showgrid");
        xAxis.classList.remove("showgrid");
        document.querySelectorAll(".spriteContainer").forEach(element => {
            element.classList.remove("showgrid");
        });
    }
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
        target = spriteMap.get(activeElement).querySelector(".spriteOffsetText");
    target.innerHTML = `left: "${parse(rect.left)}" right: "${parse(rect.right)}" top: "${parse(rect.top)}" bottom: "${parse(rect.bottom)}"`;
}

document.addEventListener( "keydown",
    (event) => {
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
            moveImage(0, +1)
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
