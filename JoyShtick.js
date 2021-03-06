// JoyShtick.js
// Matthew Olsson 10/10/2014
// JoyShtick.js Library 
// http://joyshtickblog.blogspot.com/


function JoyShtick(appWidth,appHeight,userInputJoyStickBase){

	// globals
	var joyStickBase, joyStickTop, dragging = false, canvasJoyStickBottoms, canvasJoyStickTops, canvasButtons, canvasSmartLayer, ctxjoystickbottoms, ctxjoysticktops, ctxbuttons, ctxsmartlayer, buttons = [], timeOfLastPress, buttonPressed = {button:undefined,isPressed:false}, previousOpacity, joyStickIndex = 0;
	// screen dimensions
	var applicationWidth = appWidth, applicationHeight = appHeight;
	// joystick calculations
	var xdistance,ydistance,totalDistance,adjustedX,adjustedY;
	// visible properties
	this.stickVectors = [{horizontal: undefined, vertical: undefined}];

	// constants
	var radiusOfJoyStickBase, radiusOfJoyStick, SIZE_OF_FINGERS = 20, LINE_WIDTH = 5;
	
	// "private" functions---------------------------------------------------------------------------------------------------

	// initializes the JoyShtick
	var init = (function(){
		createCanvases(applicationWidth, applicationHeight);
		if((typeof userInputJoyStickBase) === "string"){ radiusOfJoyStickBase = sanitizeInput(userInputJoyStickBase,"size"); } else { radiusOfJoyStickBase = userInputJoyStickBase; }
		radiusOfJoyStick = radiusOfJoyStickBase/2;

		// initializes canvases
		ctxjoystickbottoms = canvasJoyStickBottoms.getContext("2d");
		ctxjoystickbottoms.clearRect (0,0,ctxjoystickbottoms.canvas.width,ctxjoystickbottoms.canvas.height); 

		ctxjoysticktops = canvasJoyStickTops.getContext("2d");
		ctxjoysticktops.clearRect(0,0,ctxjoysticktops.canvas.width,ctxjoysticktops.canvas.height);

		ctxbuttons = canvasButtons.getContext("2d");
		ctxbuttons.clearRect(0,0,ctxbuttons.canvas.width,ctxbuttons.canvas.height);

		ctxsmartlayer = canvasSmartLayer.getContext("2d");
		ctxbuttons.clearRect(0,0,ctxsmartlayer.canvas.width,ctxsmartlayer.canvas.height);

		// listen for touches on the smart layer

		canvasSmartLayer.addEventListener('touchmove', function(e) {
			e.preventDefault();
			dragging = true;

			// this conditional makes sure the joystick is always looking at the correct touch on the array of touches
			if(buttonPressed.isPressed && (joyStickBase === undefined || joyStickIndex === 1)){joyStickIndex = 1;} else { joyStickIndex = 0;}

			if(joyStickBase === undefined){
				joyStickBase = {x: e.touches[joyStickIndex].clientX, y: e.touches[joyStickIndex].clientY};
				// draws base of joystick
				ctxjoystickbottoms.beginPath();
			    ctxjoystickbottoms.arc(joyStickBase.x, joyStickBase.y, radiusOfJoyStickBase, 0, 2 * Math.PI, false);
			    ctxjoystickbottoms.lineWidth = LINE_WIDTH;
			    ctxjoystickbottoms.strokeStyle = "rgba(111, 111, 111, .5)";
			    ctxjoystickbottoms.stroke();
			}

			joyStickTop = {x: e.touches[joyStickIndex].clientX, y: e.touches[joyStickIndex].clientY};
			drawJoyStickTop(joyStickBase,joyStickTop);
			updateStickVector(0,joyStickBase,joyStickTop);
		}, false);

		canvasSmartLayer.addEventListener('touchend', (function(e) {
			e.preventDefault();

			var released = {x:e.changedTouches[0].clientX, y:e.changedTouches[0].clientY};

			var buttonReleased = false;

			if(buttonPressed.isPressed){ // if a button is being pressed
				switch(buttonPressed.button.shape){
					case "square": {
						if ((((released.x-buttonPressed.button.x))<(buttonPressed.button.size+SIZE_OF_FINGERS/2)&&((released.x-buttonPressed.button.x)>(0-SIZE_OF_FINGERS/2)))&&(((released.y-buttonPressed.button.y))<(buttonPressed.button.size+SIZE_OF_FINGERS/2)&&((released.y-buttonPressed.button.y)>(0-SIZE_OF_FINGERS/2)))){
							releaseButton();
							buttonReleased = true;
						}
					} break;
					case "circle": {
						if ((((released.x-buttonPressed.button.x)*(released.x-buttonPressed.button.x))+((released.y-buttonPressed.button.y)*(released.y-buttonPressed.button.y)))<(((buttonPressed.button.size/2)*(buttonPressed.button.size/2))+(SIZE_OF_FINGERS*SIZE_OF_FINGERS))){
							releaseButton();
							buttonReleased = true;
						}
					} break;
				}
			} 
			if(dragging && buttonReleased === false){ // if the released touch doesn't intersect with a pressed button OR there are no buttons being pressed
				
				// CONFUSION: If there is one finger moving on the screen and it raises off the screen shouldn't the only coordinate in the touches array match the only coordinate in the ChangedTouches array when the finger is lifted? Trial and error prove that they only match like 90% of the time.
				
				//console.log("changed: " + released.x + " " + released.y + " Top: " + joyStickTop.x + " " + joyStickTop.y);
				//if(released.x === joyStickTop.x && released.y === joyStickTop.y){
					joyStickIndex = 0;
					dragging = false;
					joyStickBase = undefined;
					ctxjoystickbottoms.clearRect (0,0,ctxjoystickbottoms.canvas.width,ctxjoystickbottoms.canvas.height);
					ctxjoysticktops.clearRect(0,0,ctxjoysticktops.canvas.width,ctxjoysticktops.canvas.height);
					this.stickVectors[0].horizontal = undefined;
					this.stickVectors[0].vertical = undefined;
				//}
			} 

		}.bind(this)), false); // this is being bound for the stickVector property to be set

		canvasSmartLayer.addEventListener('touchstart', function(e){
			pressButton(e);
		}, false);
	}.bind(this)); // this is being bound for the stickVector property to be set

	// creates canvases, and applies css to them appropriately
	var createCanvases = function(appWidth,appHeight){

		canvasJoyStickBottoms = document.createElement("canvas");
		canvasJoyStickTops = document.createElement("canvas");
		canvasButtons = document.createElement("canvas");
		canvasSmartLayer = document.createElement("canvas");

		canvasJoyStickBottoms.style.display = canvasJoyStickTops.style.display = canvasButtons.style.display = canvasSmartLayer.style.display = "block";
		canvasJoyStickBottoms.style.margin = canvasJoyStickTops.style.margin = canvasButtons.style.margin = canvasSmartLayer.style.margin = "auto";
		canvasJoyStickBottoms.style.position = canvasJoyStickTops.style.position = canvasButtons.style.position = canvasSmartLayer.style.position = "absolute";
		canvasJoyStickBottoms.style.left = canvasJoyStickTops.style.left = canvasButtons.style.left = canvasSmartLayer.style.left = 0;
		canvasJoyStickBottoms.style.top = canvasJoyStickTops.style.top = canvasButtons.style.top = canvasSmartLayer.style.top = 0;
		canvasJoyStickBottoms.width  = canvasJoyStickTops.width = canvasButtons.width = canvasSmartLayer.width = applicationWidth;
		canvasJoyStickBottoms.height = canvasJoyStickTops.height = canvasButtons.height = canvasSmartLayer.height = applicationHeight;

		document.body.appendChild(canvasJoyStickBottoms);
		document.body.appendChild(canvasJoyStickTops);
		document.body.appendChild(canvasButtons);
		document.body.appendChild(canvasSmartLayer);
	};

	// updates the stickVector property
	var updateStickVector = (function(index,joyStickBase,currentPoint){
		this.stickVectors[index].horizontal = (currentPoint.x-joyStickBase.x);
		this.stickVectors[index].vertical = (currentPoint.y-joyStickBase.y);
	}.bind(this));

	// draws the top of the joystick and constrains it to the bases circumference
	var drawJoyStickTop = function(joyStickBase,currentPoint){
		xdistance = currentPoint.x-joyStickBase.x;
		ydistance = currentPoint.y-joyStickBase.y;
		totalDistance = (xdistance*xdistance+ydistance*ydistance);
		adjustedX = currentPoint.x;
		adjustedY = currentPoint.y; // if inside base circle no adjustments needed
		// if the top joystick is outside of the base circle
		if(totalDistance > (radiusOfJoyStickBase*radiusOfJoyStickBase)){ 
			// calculates the x and y offsets from the origin of the base joystick
			changeX = (radiusOfJoyStickBase)/Math.sqrt(1 + ((ydistance*ydistance)/(xdistance*xdistance)));
			changeY = Math.sqrt(radiusOfJoyStickBase*radiusOfJoyStickBase - changeX*changeX);
			// adjusts the offsets for all four quadrants of the circle
			changeX = changeX*xdistance/Math.abs(xdistance);
			changeY = changeY*ydistance/Math.abs(ydistance);
			// overwriting the top joysticks positions with the appropriate adjustments
			adjustedX = joyStickBase.x + changeX;
			adjustedY = joyStickBase.y + changeY;
		}
		ctxjoysticktops.clearRect(0,0,ctxjoysticktops.canvas.width,ctxjoysticktops.canvas.height);
		ctxjoysticktops.beginPath();
		ctxjoysticktops.strokeStyle = "rgba(111, 111, 111, .5)";
		ctxjoysticktops.fillStyle = "rgba(111, 111, 111, .5)";
	    ctxjoysticktops.arc(adjustedX, adjustedY, radiusOfJoyStick, 0, 2 * Math.PI, false);
	    ctxjoysticktops.lineWidth = LINE_WIDTH;
	    ctxjoysticktops.fill();
	    ctxjoysticktops.stroke();
	    ctxjoysticktops.closePath();
	};

	// sanitizes the input percentages for x,y,and size, and returns the proper result
	var sanitizeInput = function(percentageString, property){
		var tempString = percentageString.split("%"), properResult;
		if(property === "y"){ properResult = (applicationHeight/100)*parseInt(tempString[0]); }
		else if(property === "x" || property === "size"){ properResult = (applicationWidth/100)*parseInt(tempString[0]); }
		return properResult;
	};

	// draw buttons
	var drawButtons = function(specific){
		// draws buttons as they are added (only happens upon adding a button)
		if(specific === undefined){
			ctxbuttons.beginPath();
			ctxbuttons.fillStyle = buttons[buttons.length-1].color;
			ctxbuttons.strokeStyle = buttons[buttons.length-1].color;
			ctxbuttons.lineWidth = LINE_WIDTH;
			if(buttons[buttons.length-1].shape === "circle"){
			    ctxbuttons.arc(buttons[buttons.length-1].x,buttons[buttons.length-1].y, buttons[buttons.length-1].size/2, 0, Math.PI * 2, false);
			}
			else if(buttons[buttons.length-1].shape === "square"){
			    ctxbuttons.rect(buttons[buttons.length-1].x,buttons[buttons.length-1].y, buttons[buttons.length-1].size, buttons[buttons.length-1].size);
			}
			ctxbuttons.fill();
		    ctxbuttons.stroke();
		    ctxbuttons.closePath();
		}
		// draws a specific button as pressed, or if it is already pressed it redraws it as unpressed (only happens after JoyShtick is launched and running)
		else {
			var tempColor = specific.button.color.replace(/\s/g, '');
			var tempArray = tempColor.split(",");
			if(specific.isPressed){
				previousOpacity = tempArray[3];
				tempArray[3] = "1.0)";
			} else {
				tempArray[3] = previousOpacity;
			}
			specific.button.color = tempArray.toString();

			ctxbuttons.beginPath();
			ctxbuttons.fillStyle = specific.button.color;
			ctxbuttons.strokeStyle = specific.button.color;
			ctxbuttons.lineWidth = LINE_WIDTH;
			if(specific.button.shape === "circle"){
				ctxbuttons.clearRect(specific.button.x-LINE_WIDTH-specific.button.size/2,specific.button.y-LINE_WIDTH-specific.button.size/2,specific.button.size+LINE_WIDTH*2,specific.button.size+LINE_WIDTH*2);
			    ctxbuttons.arc(specific.button.x,specific.button.y, specific.button.size/2, 0, Math.PI * 2, false);
			}
			else if(specific.button.shape === "square"){
				ctxbuttons.clearRect(specific.button.x-LINE_WIDTH,specific.button.y-LINE_WIDTH,specific.button.size+LINE_WIDTH*2,specific.button.size+LINE_WIDTH*2);
			    ctxbuttons.rect(specific.button.x,specific.button.y, specific.button.size, specific.button.size);
			}
			ctxbuttons.fill();
		    ctxbuttons.stroke();
		    ctxbuttons.closePath();
		}
	};

	// press button - performs simple collisions detection with a little spare room for finger size
	var pressButton = function(e){
		if(buttons != undefined){
			// if the joystick is in use while the buttons are being pressed a different index must be consulted for touches
			if(joyStickBase != undefined){
				var press = {x:e.touches[1].clientX, y:e.touches[1].clientY};
			} else {
				var press = {x:e.touches[0].clientX, y:e.touches[0].clientY};
			}
			// checks for if a button is being pressed based on its shape and size
			for(i = 0; i < buttons.length; i++){
				if(buttons[i].shape === "circle"){
					if ((((press.x-buttons[i].x)*(press.x-buttons[i].x))+((press.y-buttons[i].y)*(press.y-buttons[i].y)))<(((buttons[i].size/2)*(buttons[i].size/2))+(SIZE_OF_FINGERS*SIZE_OF_FINGERS))){
						buttonPressed.isPressed = true;
						buttonPressed.button = buttons[i];
						drawButtons(buttonPressed);
					    buttons[i].function();
					}
				}
				else if(buttons[i].shape === "square"){
					if ((((press.x-buttons[i].x))<(buttons[i].size+SIZE_OF_FINGERS/2)&&((press.x-buttons[i].x)>(0-SIZE_OF_FINGERS/2)))&&(((press.y-buttons[i].y))<(buttons[i].size+SIZE_OF_FINGERS/2)&&((press.y-buttons[i].y)>(0-SIZE_OF_FINGERS/2)))){
						buttonPressed.isPressed = true;
						buttonPressed.button = buttons[i];
						drawButtons(buttonPressed);
						buttons[i].function();
					}
				}
			}
		}
	};

	// when a button is released it updates appropriately
	var releaseButton = function(){
		// a JoyShtick button has been pressed (not just removing the finger from the screen)
		if(buttonPressed.isPressed){
			buttonPressed.isPressed = false;
			drawButtons(buttonPressed);
		}
	};

	// visible functions---------------------------------------------------------------------------------------------------

	// must be on right side of the screen
	this.addButton = function(userInputX,userInputY,userInputFunction,userInputColor,userInputShape,userInputSize){

		if((typeof userInputX) === "string"){ userInputX = sanitizeInput(userInputX, "x"); }
		if((typeof userInputY) === "string"){ userInputY = sanitizeInput(userInputY, "y"); }
		if((typeof userInputSize) === "string"){ userInputSize = sanitizeInput(userInputSize, "size"); }

		buttons[buttons.length] = {x:userInputX,y:userInputY,function:userInputFunction,color:userInputColor,shape:userInputShape,size:userInputSize}
		drawButtons();
	};
	
	// initializes the JoyShtick after loading all of its methods
	init();
}