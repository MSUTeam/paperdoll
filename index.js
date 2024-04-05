let offsetX;
let offsetY;
let showGrid = true;
let activeElement, yAxis, xAxis, externalContainer, dummyContainer, elementContainer;
let elements = [];
document.addEventListener('DOMContentLoaded', function() {
    yAxis = document.getElementById("axis-Y");
    xAxis = document.getElementById("axis-X");
    externalContainer = document.getElementById("external");
    dummyContainer = document.getElementById("dummyContainer");
    elementContainer = document.getElementById("elementContainer");

}, false);

function addElement(ev)
{
    let tgt = ev.target,
    files = tgt.files;
    // FileReader support
    if (FileReader && files && files.length) {
        let fr = new FileReader();
        fr.onload = function () {
            var image = new Image();
            image.src = fr.result;

            let name = files[0].name;



            let container = createNewImageContainer();
            externalContainer.append(container);
            elements.push(container);
            let idx = elements.length - 1;
            container.querySelector("img").src = fr.result;
            activeElement = container;

            let listDiv = document.createElement("div");
            listDiv.classList.add("spriteDummy");
            listDiv.addEventListener("click", () => toggleElement(container))
            elementContainer.append(listDiv);
            listDiv.setAttribute("data", `idx : ${elements.length - 1}`);
            listDiv.innerHTML = files[0].name;
           

            image.onload = function() {
                container.querySelector("img").style.width = image.width;
                container.querySelector("img").style.height = image.height;
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
    div.addEventListener("click", (event) => setActiveElement(div));
    div.addEventListener("mousemove", (event) => updateCardinalText(event));
    div.addEventListener("dragstart", (event) => onDragStart(event));
    let img = document.createElement("img");
    img.classList.add("spriteImg");
    div.append(img);
    return div;
}

function toggleElement(_obj)
{
    _obj.style.display = _obj.style.display == "none" ? "block" : "none";
}

function toggleGrid(event)
{
    var checked = event.currentTarget.checked;
    yAxis.style.backgroundColor = checked ? "transparent" : "black";
    xAxis.style.backgroundColor = checked ? "transparent" : "black";
    document.querySelectorAll(".spriteContainer").forEach(element => {
        element.style.outline = checked ? "none" : "1px solid green";
    });
    
    dummyContainer.style.outline = checked ? "none" : "1px solid black";
}

function onDragStart(ev){
    console.log(ev.currentTarget)
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
    activeElement.style.left = ev.clientX - offsetX - dropTop + 'px';
    activeElement.style.top = ev.clientY - offsetY - dropLeft + 'px';

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