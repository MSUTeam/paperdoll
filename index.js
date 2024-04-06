let showGrid = true;
let activeElement, yAxis, xAxis, externalContainer, dummyContainer, elementSettingsContainer, hideGridCheckbox, paperdollSettingsContainer;
let elements = [];
let presets = {
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
                "left" : 177,
                "top" : 151,
            },
        ]
    }
}

document.addEventListener('DOMContentLoaded', function() {
    yAxis = document.getElementById("axis-Y");
    xAxis = document.getElementById("axis-X");
    externalContainer = document.getElementById("external");
    dummyContainer = document.getElementById("dummyContainer");
    elementSettingsContainer = document.getElementById("elementSettingsContainer");
    paperdollSettingsContainer = document.getElementById("paperdollSettingsContainer");
    hideGridCheckbox = document.getElementById("hideGridCheckbox");
    
    loadPresetDummy("Full Body");
    toggleGrid();
}, false);

function loadPresetDummy(_key)
{
    dummyContainer.querySelectorAll(".paperdollImg").forEach(element => {
        element.remove();
    });
    let preset = presets[_key];
    preset.Parts.forEach(element => {
        dummyContainer.style.width = preset.Container.width + "px";
        dummyContainer.style.height = preset.Container.height + "px";
        let img = document.createElement("img");
        img.classList.add("paperdollImg");
        img.draggable = false;
        img.src = element.src;
        img.style.position = "absolute";
        img.style.left = (element.left - dummyContainer.offsetLeft)  + "px";
        img.style.top = (element.top - dummyContainer.offsetTop) + "px";
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
           
            let name = document.createElement("div");
            name.classList.add("settingsNameContainer");
            name.innerHTML = files[0].name;
            name.addEventListener("click", () => toggleElement(container, name))
            settingsDiv.append(name);
            let zIndex = document.createElement("input");
            zIndex.type = "number";
            zIndex.onclick = () => container.style.zIndex = zIndex.value;
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
    updateCardinalText()
}

function createNewImageContainer()
{
    let div = document.createElement("div");
    div.draggable = true;
    div.classList.add("spriteContainer");
    if (!hideGridCheckbox.checked)
     div.classList.add("showgrid");
    div.addEventListener("click", (event) => setActiveElement(div));
    div.addEventListener("mousemove", (event) => updateCardinalText(event));
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

    updateCardinalText();
}

function dragover_handler(ev) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
};

function updateCardinalText(ev)
{
    const spriteRect = activeElement.getBoundingClientRect();
    const yRect = yAxis.getBoundingClientRect();
    const xRect = xAxis.getBoundingClientRect();
    const left =  spriteRect.left - yRect.left;
    const right =  spriteRect.right - yRect.right;
    const top = spriteRect.top - xRect.top;
    const bottom = spriteRect.bottom - xRect.bottom;
    document.getElementById("textleft").innerHTML = "left: " + parseInt(left)
    document.getElementById("textright").innerHTML = "right: " + parseInt(right) 
    document.getElementById("texttop").innerHTML = "top: " + parseInt(top)
    document.getElementById("textbottom").innerHTML = "bottom: " + parseInt(bottom)
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
}