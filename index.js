let offsetX;
let offsetY;
let showGrid = true;
let yAxis, xAxis, spriteContainer, externalContainer, dummyContainer, elementContainer, spriteImg;
let elements = {};
let activeElement;
document.addEventListener('DOMContentLoaded', function() {
    yAxis = document.getElementById("axis-Y");
    xAxis = document.getElementById("axis-X");
    spriteContainer = document.getElementById("spriteContainer");
    externalContainer = document.getElementById("external");
    dummyContainer = document.getElementById("dummyContainer");
    elementContainer = document.getElementById("elementContainer");
    spriteImg = document.getElementById("spriteImg");

    updateCardinalText();
}, false);

function addElement(ev)
{
    let tgt = ev.target,
    files = tgt.files;
    // FileReader support
    if (FileReader && files && files.length) {
        let fr = new FileReader();
        fr.onload = function () {
            let name = files[0].name;
            var image = new Image();
            let div = document.createElement("div");
            div.classList.add("spriteDummy");
            div.addEventListener("click", () => activateElement(name))
            elementContainer.append(div);

            elements[name] = {
                "src" : fr.result,
                "img" : image,
                "left" : 0,
                "top" : 0,
                "width" : 0,
                "height" : 0
            };
            activeElement = elements[name];
            image.src = fr.result;

            image.onload = function() {
                // access image size here 
                let og = document.getElementById("spriteImg");
                og.src = fr.result;
                elements[name].src = fr.result;
                spriteContainer.style.width = image.width;
                spriteContainer.style.height = image.height;
                div.setAttribute("data", `src : ${files[0]}`);
                div.innerHTML = files[0].name;
                activeSrc = og.src;
            };
        }
        fr.readAsDataURL(files[0]);
    }
}

function updateElement()
{
    activeElement.left = spriteContainer.offsetLeft;
    activeElement.top = spriteContainer.offsetTop;
    activeElement.width = spriteImg.width;
    activeElement.height = spriteImg.height;
    activeElement.src = spriteImg.src;
}

function activateElement(_src)
{
    if (activeElement )
        updateElement()
    let imgObj = elements[_src];
    spriteImg.src = imgObj.img.src;
    spriteContainer.style.width = imgObj.width;
    spriteContainer.style.height = imgObj.height;
    spriteContainer.style.left = `${imgObj.left}px`;
    spriteContainer.style.top = `${imgObj.top}px`;
    activeElement = imgObj;
    updateCardinalText();
}
function toggleGrid(event)
{
    var checked = event.currentTarget.checked;
    yAxis.style.backgroundColor = checked ? "transparent" : "black";
    xAxis.style.backgroundColor = checked ? "transparent" : "black";
    spriteContainer.style.outline = checked ? "none" : "1px solid green";
    dummyContainer.style.outline = checked ? "none" : "1px solid black";
}

function onDragStart(ev){
    const rect = document.getElementById("spriteContainer").getBoundingClientRect();

    offsetX = ev.clientX - rect.x;
    offsetY = ev.clientY - rect.y;
}

function drop_handler(ev) {
    ev.preventDefault();

    const dropTop = externalContainer.getBoundingClientRect().top;
    const dropLeft = externalContainer.getBoundingClientRect().left;
    spriteContainer.style.position = "absolute";
    spriteContainer.style.left = ev.clientX - offsetX - dropTop + 'px';
    spriteContainer.style.top = ev.clientY - offsetY - dropLeft + 'px';

    updateCardinalText();
}

function dragover_handler(ev) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
};

function updateCardinalText(ev)
{
    const spriteRect = spriteContainer.getBoundingClientRect();
    const yRect = yAxis.getBoundingClientRect();
    const xRect = xAxis.getBoundingClientRect();
    const left =  spriteRect.left - yRect.left;
    const right =  spriteRect.right - yRect.right;
    const top = spriteRect.top - xRect.top;
    const bottom = spriteRect.bottom - xRect.bottom;
    document.getElementById("textleft").innerHTML = "left: " + (parseInt(left) + 1)
    document.getElementById("textright").innerHTML = "right: " + parseInt(right) 
    document.getElementById("texttop").innerHTML = "top: " + parseInt(top)
    document.getElementById("textbottom").innerHTML = "bottom: " + (parseInt(bottom) + 1)
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
    let container = document.getElementById("spriteContainer");
    console.log(container.offsetLeft)
    container.style.left = `${container.offsetLeft + x}px`;
    container.style.top = `${container.offsetTop + y}px`;
}