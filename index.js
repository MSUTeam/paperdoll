let activeElement, yAxis, xAxis, externalContainer, elementSettingsContainer, hideGridCheckbox, spriteCardinals, paperdollPresets;
const spriteMap = new Map()
var XMLMap = {}
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
    settingsDiv.addEventListener("click", (event) => { event.stopPropagation(); setActiveElement(container)})
    elementSettingsContainer.append(settingsDiv);

    let name = document.createElement("span");
    name.classList.add("settingsNameContainer");
    name.innerHTML = _name;
    settingsDiv.append(name);
    let nameSplit = _name.split("/");
    let nameStem = nameSplit[nameSplit.length - 1].replace('.png','').replace('.jpg','').replace('.jpeg','');
    container.setAttribute("sprite_id", nameStem);

    let offsetText = document.createElement("div");
    offsetText.classList.add("spriteOffsetText");
    settingsDiv.append(offsetText);
    offsetText.addEventListener("click", (event) => {event.stopPropagation();navigator.clipboard.writeText(offsetText.innerHTML)})

    const opacitySliderText = document.createElement("div");
    opacitySliderText.innerHTML = "Opacity";
    settingsDiv.append(opacitySliderText);
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
    settingsDiv.append(opacitySlider);

    let zIndexLabel = document.createElement("div");
    zIndexLabel.innerHTML="Z-Index";
    settingsDiv.append(zIndexLabel);
    let zIndex = document.createElement("input");
    zIndex.type = "number";
    zIndex.onclick = (event) => {event.stopPropagation(); container.style.zIndex = zIndex.value};
    settingsDiv.append(zIndex);

    spriteMap.set(container, settingsDiv);

    setActiveElement(container);
    let cardinals = {};
    if (nameStem in XMLMap)
        cardinals = XMLMap[nameStem]
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
                    const id = sprite.getAttribute("id");
                    const cardinals = {
                        id: id,
                        left: parseInt(sprite.getAttribute("left")) || 0,
                        right: parseInt(sprite.getAttribute("right")) || 0,
                        top: parseInt(sprite.getAttribute("top")) || 0,
                        bottom: parseInt(sprite.getAttribute("bottom")) || 0,
                    }
                    XMLMap[id] = cardinals;
                    spriteMap.forEach((_value, key) => {
                        console.log(key)
                        if (key.getAttribute("sprite_id") == id)
                            positionWithCardinals(key, cardinals);
                    })
                }
            }
            fr.readAsText(files[x]);
        }
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
    domtoimage.toJpeg(externalContainer)
    .then(function (dataUrl) {
        var link = document.createElement('a');
        link.download = 'my-image-name.jpeg';
        link.href = dataUrl;
        link.click();
    });
}