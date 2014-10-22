// JoyShtick.html 
// Matthew Olsson 10/10/2014
// JoyShtick.js Library 
// http://joyshtickblog.blogspot.com/


function JoyShtick(appWidth,appHeight){

	// globals
	var initialPoint, endPoint, dragging = false, canvasBaseLeft, canvasTopLeft, canvasBaseRight, ctxbaseleft, ctxtopleft, ctxbaseright, buttons = [], timeOfLastPress, buttonPressed = {button:undefined,isPressed:false}, previousOpacity;
	// screen dimensions
	var applicationWidth = appWidth, applicationHeight = appHeight;
	// joystick calculations
	var xdistance,ydistance,totalDistance,adjustedX,properY;
	// visible properties
	this.stickVector = {horizontal: undefined, vertical: undefined};

	// constants
	// TODO - change size of joystick to be responsive to screen size
	// TODO - accept size of parent DOM element on initialization
	var RADIUS_OF_JOYSTICK_BASE = 40, RADIUS_OF_JOYSTICK = 25, SIZE_OF_FINGERS = 20, LINE_WIDTH = 5;
	
	var init = (function(){
		
		createCanvases(applicationWidth, applicationHeight);

		// initializes canvases
		ctxbaseleft = canvasBaseLeft.getContext("2d");
		ctxbaseleft.clearRect (0,0,ctxbaseleft.canvas.width,ctxbaseleft.canvas.height); 

		ctxtopleft = canvasTopLeft.getContext("2d");
		ctxtopleft.clearRect(0,0,ctxtopleft.canvas.width,ctxtopleft.canvas.height);

		ctxbaseright = canvasBaseRight.getContext("2d");
		ctxbaseright.clearRect(0,0,ctxbaseright.canvas.width,ctxbaseright.canvas.height);

		// listen for touches
		canvasTopLeft.addEventListener('touchstart', function(e) { e.preventDefault(); }, false);

		canvasTopLeft.addEventListener('touchmove', function(e) {
			e.preventDefault();
			dragging = true;
			if(initialPoint === undefined){
				initialPoint = {x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY};
				// draws base of joystick
				ctxbaseleft.beginPath();
			    ctxbaseleft.arc(initialPoint.x, initialPoint.y, RADIUS_OF_JOYSTICK_BASE, 0, 2 * Math.PI, false);
			    ctxbaseleft.lineWidth = LINE_WIDTH;
			    ctxbaseleft.strokeStyle = "rgba(111, 111, 111, .5)";
			    ctxbaseleft.stroke();
			}

			endPoint = {x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY};
			drawJoyStickTop(initialPoint,endPoint);
			updateStickVector(initialPoint,endPoint);
		}, false);

		canvasTopLeft.addEventListener('touchend', (function(e) {
			e.preventDefault();
			if(dragging){
				dragging = false;
				initialPoint = undefined;
				ctxbaseleft.clearRect (0,0,ctxbaseleft.canvas.width,ctxbaseleft.canvas.height);
				ctxtopleft.clearRect(0,0,ctxtopleft.canvas.width,ctxtopleft.canvas.height);
				this.stickVector.horizontal = undefined;
				this.stickVector.vertical = undefined;
			}
		}.bind(this)), false);

		canvasBaseRight.addEventListener('touchstart', function(e){
			pressButton(e);
		}, false);

		canvasBaseRight.addEventListener('touchend', function(e){
			releaseButton();
		}, false);
	}.bind(this));

	var createCanvases = function(appWidth,appHeight){
		canvasBaseLeft = document.createElement("canvas");
		canvasBaseLeft.style.display = "block";
		canvasBaseLeft.style.margin = "auto";
		canvasBaseLeft.style.position = "absolute";
		canvasBaseLeft.style.zIndex = 0;
		canvasBaseLeft.style.left = 0;
		canvasBaseLeft.style.top = 0;
		canvasBaseLeft.width  = applicationWidth/2;
		canvasBaseLeft.height = applicationHeight;
		document.body.appendChild(canvasBaseLeft);
		
		canvasTopLeft = document.createElement("canvas");
		canvasTopLeft.style.display = "block";
		canvasTopLeft.style.margin = "auto";
		canvasTopLeft.style.position = "absolute";
		canvasTopLeft.style.zIndex = 1;
		canvasTopLeft.style.left = 0;
		canvasTopLeft.style.top = 0;
		canvasTopLeft.width  = applicationWidth/2;
		canvasTopLeft.height = applicationHeight;
		document.body.appendChild(canvasTopLeft);

		canvasBaseRight = document.createElement("canvas");
		canvasBaseRight.style.display = "block";
		canvasBaseRight.style.position = "absolute";
		canvasBaseRight.style.zIndex = 0;
		canvasBaseRight.style.left = 0;
		canvasBaseRight.style.top = 0;
		canvasBaseRight.style.marginLeft = appWidth/2; 
		canvasBaseRight.width  = applicationWidth/2;
		canvasBaseRight.height = applicationHeight;
		document.body.appendChild(canvasBaseRight);
	};

	var updateStickVector = (function(initialPoint,currentPoint){
		this.stickVector.horizontal = (currentPoint.x-initialPoint.x);
		this.stickVector.vertical = (currentPoint.y-initialPoint.y);
	}.bind(this));

	var drawJoyStickTop = function(initialPoint,currentPoint){
		xdistance = currentPoint.x-initialPoint.x;
		ydistance = currentPoint.y-initialPoint.y;
		totalDistance = (xdistance*xdistance+ydistance*ydistance);
		adjustedX = currentPoint.x,adjustedY = currentPoint.y; // if inside base circle no adjustments needed
		// if the top joystick is outside of the base circle
		if(totalDistance > 1600){ 
			// calculates the x and y offsets from the origin of the base joystick
			changeX = (RADIUS_OF_JOYSTICK_BASE)/Math.sqrt(1 + ((ydistance*ydistance)/(xdistance*xdistance)));
			changeY = Math.sqrt(RADIUS_OF_JOYSTICK_BASE*RADIUS_OF_JOYSTICK_BASE - changeX*changeX);
			// adjusts the offsets for all four quadrants of the circle
			changeX = changeX*xdistance/Math.abs(xdistance);
			changeY = changeY*ydistance/Math.abs(ydistance);
			// overwriting the top joysticks positions with the appropriate adjustments
			adjustedX = initialPoint.x + changeX;
			adjustedY = initialPoint.y + changeY;
		}
		ctxtopleft.clearRect(0,0,ctxtopleft.canvas.width,ctxtopleft.canvas.height);
		ctxtopleft.beginPath();
		ctxtopleft.strokeStyle = "rgba(111, 111, 111, .5)";
		ctxtopleft.fillStyle = "rgba(111, 111, 111, .5)";
	    ctxtopleft.arc(adjustedX, adjustedY, RADIUS_OF_JOYSTICK, 0, 2 * Math.PI, false);
	    ctxtopleft.lineWidth = LINE_WIDTH;
	    ctxtopleft.fill();
	    ctxtopleft.stroke();
	    ctxtopleft.closePath();
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
			ctxbaseright.beginPath();
			ctxbaseright.fillStyle = buttons[buttons.length-1].color;
			ctxbaseright.strokeStyle = buttons[buttons.length-1].color;
			ctxbaseright.lineWidth = LINE_WIDTH;
			if(buttons[buttons.length-1].shape === "circle"){
			    ctxbaseright.arc(buttons[buttons.length-1].x-applicationWidth/2,buttons[buttons.length-1].y, buttons[buttons.length-1].size/2, 0, Math.PI * 2, false);
			}
			else if(buttons[buttons.length-1].shape === "square"){
			    ctxbaseright.rect(buttons[buttons.length-1].x-applicationWidth/2,buttons[buttons.length-1].y, buttons[buttons.length-1].size, buttons[buttons.length-1].size);
			}
			ctxbaseright.fill();
		    ctxbaseright.stroke();
		    ctxbaseright.closePath();
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

			ctxbaseright.beginPath();
			ctxbaseright.fillStyle = specific.button.color;
			ctxbaseright.strokeStyle = specific.button.color;
			ctxbaseright.lineWidth = LINE_WIDTH;
			if(specific.button.shape === "circle"){
				ctxbaseright.clearRect(specific.button.x-applicationWidth/2-LINE_WIDTH-specific.button.size/2,specific.button.y-LINE_WIDTH-specific.button.size/2,specific.button.size+LINE_WIDTH*2,specific.button.size+LINE_WIDTH*2);
			    ctxbaseright.arc(specific.button.x-applicationWidth/2,specific.button.y, specific.button.size/2, 0, Math.PI * 2, false);
			}
			else if(specific.button.shape === "square"){
				ctxbaseright.clearRect(specific.button.x-applicationWidth/2-LINE_WIDTH,specific.button.y-LINE_WIDTH,specific.button.size+LINE_WIDTH*2,specific.button.size+LINE_WIDTH*2);
			    ctxbaseright.rect(specific.button.x-applicationWidth/2,specific.button.y, specific.button.size, specific.button.size);
			}
			ctxbaseright.fill();
		    ctxbaseright.stroke();
		    ctxbaseright.closePath();
		}
	};
	// press button - performs simple collisions detection with a little spare room for finger size
	// TODO - fix mouse x and y coordinates to account for the application not being in the top left
	var pressButton = function(e){
		if(buttons != undefined){
			// The joystick is in use while the buttons are being pressed
			if(initialPoint != undefined){
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
	// release button
	var releaseButton = function(){
		// a JoyShtick button has been pressed (not just removing the finger from the screen)
		if(buttonPressed.isPressed){
			buttonPressed.isPressed = false;
			drawButtons(buttonPressed);
		}
	};

	// visible functions
	// must be on right side of the screen
	this.addButton = function(userInputX,userInputY,userInputFunction,userInputColor,userInputShape,userInputSize){

		if((typeof userInputX) === "string"){ userInputX = sanitizeInput(userInputX, "x"); }
		if((typeof userInputY) === "string"){ userInputY = sanitizeInput(userInputY, "y"); }
		if((typeof userInputSize) === "string"){ userInputSize = sanitizeInput(userInputSize, "size"); }

		buttons[buttons.length] = {x:userInputX,y:userInputY,function:userInputFunction,color:userInputColor,shape:userInputShape,size:userInputSize}
		drawButtons();
	};

	init();
}