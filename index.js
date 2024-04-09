let showGrid = true;
let activeElement, yAxis, xAxis, externalContainer, elementSettingsContainer, hideGridCheckbox, spriteCardinals;

const spriteToSettingsDivMap = {};
let elements = [];

let presets = {
    "Head" : {    
        Parts : [
            {
                "src" : "head.png",
                left : -21,
                top: -20,
                right : 29,
                bottom : 48,
            },
        ]
    },
    "Body" : {
        Parts : [
            {
                "src" : "body.png",
                top: -48,
                bottom : 10,
            },
        ]
    },
}
document.addEventListener('DOMContentLoaded', function() {
    yAxis = document.getElementById("axis-Y");
    xAxis = document.getElementById("axis-X");
    externalContainer = document.getElementById("externalContainer");
    elementSettingsContainer = document.getElementById("elementSettingsContainer");
    hideGridCheckbox = document.getElementById("hideGridCheckbox");
    spriteCardinals = document.getElementById("spriteCardinals");

    document.getElementById("spritePositioner").addEventListener("keypress", function(event){
        if (event.key !== 'Enter')
            return;
        handlePassedCardinals();
    })
    
    toggleGrid();
}, false);

function loadPresetDummy(_key)
{
    let preset = presets[_key];
    preset.Parts.forEach(element => {
        positionWithCardinals(addSprite(element.src, element.src), element);
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
    const yRect = yAxis.getBoundingClientRect();
    const xRect = xAxis.getBoundingClientRect();
    const img = _element.querySelector("img");
    const containerRect = externalContainer.getBoundingClientRect();
    // either get the cardinals from the preset, or use the img source natural values
    const left =    Math.abs(yRect.left - containerRect.left)       + (_cardinals.left || -(img.naturalWidth/2));
    const right =   Math.abs(yRect.right - containerRect.right)     - (_cardinals.right || (img.naturalWidth/2));
    const top =     Math.abs(xRect.top - containerRect.top)         - (_cardinals.bottom || -(img.naturalHeight/2));
    const bottom =  Math.abs(xRect.bottom - containerRect.bottom)   + (_cardinals.top || (img.naturalHeight/2));
    _element.style.position = "absolute";
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
            addSprite(fr.result, files[0].name)
        }
        fr.readAsDataURL(files[0]);
    }
}

function drop_handler(ev) {
    ev.preventDefault();
    if (ev.dataTransfer.files.length > 0) {
        [...ev.dataTransfer.files].forEach((file, i) => {
            let fr = new FileReader();
            fr.onload = function () {
                addSprite(fr.result, file.name)
            }
            fr.readAsDataURL(file);
        });
        return;
    }

    const dropTop = externalContainer.getBoundingClientRect().top;
    const dropLeft = externalContainer.getBoundingClientRect().left;
    activeElement.style.position = "absolute";
    activeElement.style.left = ev.clientX - offsetX - dropLeft + 'px';
    activeElement.style.top = ev.clientY - offsetY - dropTop + 'px';
}

function addSprite(_src, _name)
{
    var image = new Image();
    image.src = _src;

    let container = createNewImageContainer();
    externalContainer.append(container);
    elements.push(container);
    container.querySelector("img").src = _src;
    let settingsDiv = document.createElement("div");
    settingsDiv.classList.add("spriteDummy");
    settingsDiv.addEventListener("click", (event) => {event.stopPropagation(); toggleElement(container, name)})
    spriteToSettingsDivMap[container] = settingsDiv;
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
    elementSettingsContainer.append(settingsDiv);
    

    image.onload = function() {
        container.style.width = image.width;
        container.style.height = image.height;
    };  
    setActiveElement(container)
    return container;
}

function setActiveElement(_elem)
{
    if (activeElement)
    {
        activeElement.classList.remove("activeElement");
    }
        
    activeElement = _elem;
    activeElement.classList.add("activeElement");
}

function createNewImageContainer()
{
    let div = document.createElement("div");
    div.draggable = true;
    div.classList.add("spriteContainer");
    if (!hideGridCheckbox.checked)
        div.classList.add("showgrid");
    div.addEventListener("click", (event) => setActiveElement(div));
    div.addEventListener("dragstart", (event) => onDragStart(event));
    let img = document.createElement("img");
    img.classList.add("spriteImg");
    div.append(img);
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

let offsetX;
let offsetY;

function onDragStart(ev){
    setActiveElement(ev.currentTarget)
    const rect = activeElement.getBoundingClientRect();

    offsetX = ev.clientX - rect.x;
    offsetY = ev.clientY - rect.y;
}

function dragover_handler(ev) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
};

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
        target = spriteToSettingsDivMap[el].querySelector(".spriteOffsetText");
    target.innerHTML = `left: "${parse(rect.left)}" right: "${parse(rect.right)}" top: "${parse(rect.top)}" bottom: "${parse(rect.bottom)}"`;
}

document.addEventListener( "keydown",
    (event) => {
     switch (event.key)
     {
        case "ArrowRight":
            moveImage(1, 0)
            break;
        case "ArrowLeft":
            moveImage(-1, 0)
            break;
        case "ArrowUp":
            moveImage(0, -1)
            break;
        case "ArrowDown":
            moveImage(0, +1)
            break;
        case "Delete":
            if (activeElement)
            {
                spriteToSettingsDivMap[activeElement].remove();
                activeElement.remove();
            }
            break;
     }
    },
    true,
);
function moveImage(x=0, y=0)
{
    activeElement.style.left = `${activeElement.offsetLeft + x}px`;
    activeElement.style.top = `${activeElement.offsetTop + y}px`;
}