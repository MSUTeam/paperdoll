let showGrid = true;
let activeElement, yAxis, xAxis, externalContainer, dummyContainer, elementSettingsContainer, hideGridCheckbox, paperdollSettingsContainer, spriteCardinals, paperdollCardinals;

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
                width : 104,
                height : 142,
                offsetY : -35,
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
    "Full Body" : {
        Container : {
            width : 119,
            height : 114,
        },
        Parts : [
            {
                "src" : "body.png",
                "left" : 158,
                "top" : 187,
            },
            {
                "src" : "head.png",
                offsetY : -30,
                "left" : 177,
                "top" : 151,
            },
        ]
    }
}

document.addEventListener('DOMContentLoaded', function() {
    yAxis = document.getElementById("axis-Y");
    xAxis = document.getElementById("axis-X");
    externalContainer = document.getElementById("externalContainer");
    dummyContainer = document.getElementById("dummyContainer");
    elementSettingsContainer = document.getElementById("elementSettingsContainer");
    paperdollSettingsContainer = document.getElementById("paperdollSettingsContainer");
    hideGridCheckbox = document.getElementById("hideGridCheckbox");
    spriteCardinals = document.getElementById("spriteCardinals");
    paperdollCardinals = document.getElementById("paperdollCardinals");
    
    loadPresetDummy("Head");
    toggleGrid();
}, false);

function loadPresetDummy(_key)
{
    dummyContainer.querySelectorAll(".paperdollImg").forEach(element => {
        element.remove();
    });
    paperdollSettingsContainer.innerHTML = "";
    let preset = presets[_key];
    preset.Parts.forEach(element => {
        let img = document.createElement("img");
        img.classList.add("paperdollImg");
        img.draggable = false;
        img.src = element.src;
        dummyContainer.append(img);
        let settingsDiv = document.createElement("div");
        let name = document.createElement("div");
        name.classList.add("settingsNameContainer");
        name.innerHTML = element.src;
        settingsDiv.append(name);
        let zIndex = document.createElement("input");
        zIndex.type = "number";
        zIndex.onclick = () => img.style.zIndex = zIndex.value;
        settingsDiv.append(zIndex);
        paperdollSettingsContainer.append(settingsDiv);
        // resize the bounding box
        img.onload = function() {
            const yRect = yAxis.getBoundingClientRect();
            const xRect = xAxis.getBoundingClientRect();
            const containerRect = externalContainer.getBoundingClientRect();
            // either get the cardinals from the preset, or use the img source natural values
            const left =    Math.abs(yRect.left - containerRect.left)       + (element.left || -(img.naturalWidth/2));
            const right =   Math.abs(yRect.right - containerRect.right)     - (element.right || (img.naturalWidth/2));
            const top =     Math.abs(xRect.top - containerRect.top)         + (element.top || -(img.naturalHeight/2));
            const bottom =  Math.abs(xRect.bottom - containerRect.bottom)   - (element.bottom || (img.naturalHeight/2));
            dummyContainer.style.position = "absolute";
            dummyContainer.style.left =     (left)  + "px";
            dummyContainer.style.right =    (right)  + "px";
            dummyContainer.style.top =      (top) + "px";
            dummyContainer.style.bottom =   (bottom)  + "px";
            updateCardinalText(dummyContainer, paperdollCardinals);
        }; 
    });
}
function addElement(ev)
{
    let tgt = ev.target,
    files = tgt.files;
    if (FileReader && files && files.length) {
        let fr = new FileReader();
        fr.onload = function () {
            var image = new Image();
            image.src = fr.result;


            let container = createNewImageContainer();
            externalContainer.append(container);
            elements.push(container);
            container.querySelector("img").src = fr.result;
            setActiveElement(container)

            let settingsDiv = document.createElement("div");
            settingsDiv.classList.add("spriteDummy");
            settingsDiv.addEventListener("click", (event) => {event.stopPropagation(); toggleElement(container, name)})
           
            let nameLabel = document.createElement("div");
            nameLabel.innerHTML = "Click box to hide element";
            settingsDiv.append(nameLabel);
            let name = document.createElement("span");
            name.classList.add("settingsNameContainer");
            name.innerHTML = files[0].name;
            
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
        }
        fr.readAsDataURL(files[0]);
    }
}

function setActiveElement(_elem)
{
    if (activeElement)
    {
        activeElement.classList.remove("activeElement");
    }
        
    activeElement = _elem;
    activeElement.classList.add("activeElement");
    updateCardinalText(activeElement, spriteCardinals)
}

function createNewImageContainer()
{
    let div = document.createElement("div");
    div.draggable = true;
    div.classList.add("spriteContainer");
    if (!hideGridCheckbox.checked)
     div.classList.add("showgrid");
    div.addEventListener("click", (event) => setActiveElement(div));
    div.addEventListener("mousemove", (event) => updateCardinalText(div, spriteCardinals));
    div.addEventListener("dragstart", (event) => onDragStart(event));
    let img = document.createElement("img");
    img.classList.add("spriteImg");
    div.append(img);
    return div;
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
        dummyContainer.classList.add("showgrid");
        document.querySelectorAll(".spriteContainer").forEach(element => {
            element.classList.add("showgrid");
        });
    }
    else
    {
        yAxis.classList.remove("showgrid");
        xAxis.classList.remove("showgrid");
        dummyContainer.classList.remove("showgrid");
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

function drop_handler(ev) {
    ev.preventDefault();

    const dropTop = externalContainer.getBoundingClientRect().top;
    const dropLeft = externalContainer.getBoundingClientRect().left;
    activeElement.style.position = "absolute";
    activeElement.style.left = ev.clientX - offsetX - dropLeft + 'px';
    activeElement.style.top = ev.clientY - offsetY - dropTop + 'px';

    updateCardinalText(activeElement, spriteCardinals);
}

function dragover_handler(ev) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
};

function getCenterOffsets(_element)
{
    const yRect = yAxis.getBoundingClientRect();
    const xRect = xAxis.getBoundingClientRect();
    const left =  _element.left -   yRect.left;
    const right =  _element.right - yRect.left;
    const top = _element.top -      xRect.top;
    const bottom = _element.bottom -xRect.top;
    return {left:left, right:right, top:top, bottom:bottom}
}

function updateCardinalText(el, target)
{
    const rect = getCenterOffsets(el.getBoundingClientRect());
    const parse = (_el) => Math.round(parseFloat(_el));
    target.innerHTML = `left: "${parse(rect.left)}" right: "${parse(rect.right)}" top: "${parse(rect.top)}" bottom: "${parse(rect.bottom)}"`;
}

function copyCardinals(_element)
{
    navigator.clipboard.writeText(_element.innerHTML)
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
     }
    },
    true,
);
function moveImage(x=0, y=0)
{
    activeElement.style.left = `${activeElement.offsetLeft + x}px`;
    activeElement.style.top = `${activeElement.offsetTop + y}px`;
    updateCardinalText(activeElement, spriteCardinals);
}