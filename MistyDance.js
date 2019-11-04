//-------------------------------------------------------------------------//
// Misty Dance skill with iceskating moves - by Phillip Ha 
// First version 08/03/2019
// Revised version: 11/01/2019
// This skill is created to demonstrate the utilization of 
// the essential support functions.  They can be used to
// build more advanced navigation skills. This skill include
// - Battery health check to allow locomotive functions to run
// - Using the available API driving functions to make the dance moves
//   following the song mood
// - Obstacle avoidance using all available sensors
// - Hazard notification to indicate the situation where Misty's
//   sensors detect hazard condition/threshold triggered
// - Using head and arm movement to show poses
// - LEDs usage with mulitple colors setting in the sensors' callbacks
//------------------------------------------------------------------------//

// Misty moves in the direction according to the dancing move plan for the music mood/ beat of "I will survive" song 
// uses Time of Flight and Bump Sensors to stop and move away when she gets close to an obstacle
misty.Debug("Initialize head and arms in idle positions");
misty.MoveHead(0, 0, 0, 100);
misty.MoveArms(-45, -45, 100, 100);
misty.Pause(3000);

misty.Set("StartTime",(new Date()).toUTCString());
misty.Set("CurrentCompass", 0);
misty.Set("last_YawData", 0);
misty.Set("tofTriggeredAt",(new Date()).toUTCString());
misty.Set("tofTriggered", false);
misty.Set("driveStartAt",(new Date()).toUTCString());
misty.Set("timeInDrive", 5);
misty.Set("BatteryCheckMode", 0);
misty.Set("BatteryIsLow",false);
misty.Set("DanceSequenceIndex",0);
misty.Set("DanceFinished",false);

_linear_velocity = 40.0;
_CurrentCompass = 0.0;
_last_Yaw = 0.0;
_YawToCompassConversionFactor = 0.0;

registerBatteryMonitoring();
// register the IMU event with the only Yaw data in the result
register_YawIMU();
// Register Hazard notification and will let it register ToF when getting to that situation to resolve
// register_HazardNotification();
misty.Pause(2000);
misty.Debug("Start the dancing pose with moving head and arms");

// Misty will regularly have the battery level check and will stop running if power is lower than healthy threshold of 7.6V.
// Misty will dance in a safe free area.  However, she may encounter an obstacle for any reasons.  Below is the handling list.
// Everytime a Time of Flight or Bump sensor callback is triggered 
// 1. Unregister the ToFs and Bump senosrs because we do not want the ToFs to keep triggering the callback indefinitely 
//    until the misty backs up
// 2. We execute the back up or forward drive command to get away from the obstacle to the safe dance area
// 3. After about 4 seconds which it would be a good time for Misty to re-register to ToFs and Bump Sensors to br ready for
//    the next move

while (!misty.Get("BatteryIsLow") && !misty.Get("DanceFinished")) {
	misty.Pause(50);
	// check for tof sensors ' triggered
	if (misty.Get("tofTriggered")) {
        if (secondsPast(misty.Get("tofTriggeredAt")) > 4.0) {
            misty.Set("tofTriggered", false);
        }
	}
	
	//OK to drive after the last move or the callback got enough time to drive away from an obstacle
    if (secondsPast(misty.Get("driveStartAt")) > misty.Get("timeInDrive") && !misty.Get("tofTriggered")) {
        misty.Set("driveStartAt",(new Date()).toUTCString());
        switch(misty.Get("DanceSequenceIndex")){
            case 0:{
                misty.MoveHead(0, 0, 0, 100);
                misty.MoveArms(0, 0, 100, 100);
                misty.Pause(2000);
                spinLeft_360();
                misty.Pause(2000);
                misty.Set("DanceSequenceIndex",1);
                break;
            }
            case 1:{
                DriveBackwardLeft();
                misty.Pause(2000);
                misty.Set("DanceSequenceIndex",2);
                break;
            }
            case 2:{
                DriveInCycleCW();
                misty.Pause(2000);
                misty.Set("DanceSequenceIndex",3);
                break;
            }
            case 3:{
                misty.MoveHead(0, 0, 70, 100);
                misty.Pause(3000);
                bothArmsLU_RD();
                bothArmsLU_RD();
                misty.Pause(1000);
                spinRight_360();
                misty.Pause(2000);
                misty.Set("DanceSequenceIndex",4);
                break;
            }
            case 4:{
                misty.MoveHead(0, 0, -70, 100);
                misty.Pause(3000);
                bothArmsLD_RU();
                bothArmsLD_RU();
                misty.Pause(3000);
                DriveInCycleCW();
                misty.Pause(2000);
                misty.Set("DanceSequenceIndex",5);
                break;
            }
            case 5:{
                spinRight_360();
                misty.Pause(3000);
                misty.Set("DanceSequenceIndex",6);
                break;
            }
            case 6:{
                DriveBackwardRight();
                misty.Pause(2000);
                misty.Set("DanceSequenceIndex",7);
                break;
            }
            case 7:{
                DriveInCycleCCW();
                misty.Pause(3000);
                misty.Set("DanceSequenceIndex",8);
                break;
            }
            case 8:{
                spinLeft_360();
                misty.Pause(3000);
                misty.Set("DanceSequenceIndex",9);
                break;
            }
            case 9:{
                misty.MoveHead(-15, 0, 0, 100);
                misty.MoveArms(45, 45, 100, 100);
                misty.Pause(2000);
                misty.Set("DanceSequenceIndex",10);
                break;
            }
            default:{
                misty.MoveHead(0, 0, 0, 100);
                misty.MoveArms(45, 45, 100, 100);
                misty.Pause(2000);
                misty.Set("DanceFinished",true);
                // Turn off the sensor monitoring for soft surface like soft carpet
                // To avoid false detection that interrupt the dancing sequence
                // unregisterAll();
                // unRegister_HazardNotification();
                unregister_YawIMU();
                misty.Stop();
                break;
            }
        }
        misty.Set("timeInDrive", 5);
    }
}

// ------------------------------------------Supporting Functions------------------------------------------

//------------------------ Battery monitoring-----------------------------------
//  When the voltage is low, Misty won't be able to drive and taking
//  pictures from 4K and depth camera. A notification will be announced
//  and Misty will stop driving until battery is charged to good level > 7.6V
//------------------------------------------------------------------------------
function registerBatteryMonitoring(){

	if(misty.Get("BatteryCheckMode") == 0){
		misty.AddPropertyTest("BatteryLow", "voltage", "<=", 7.60, "double"); 
		misty.RegisterEvent("BatteryLow", "BatteryCharge", 0, false);
	}
	else if(misty.Get("BatteryCheckMode") == 1){
		misty.AddPropertyTest("BatteryOK", "voltage", ">=", 7.70, "double"); 
		misty.RegisterEvent("BatteryOK", "BatteryCharge", 0, false);
	}
	else{
		misty.AddPropertyTest("BatteryGood", "voltage", ">=", 8.0, "double"); 
		misty.RegisterEvent("BatteryGood", "BatteryCharge", 0, false);
	}
}

function unregisterBatteryMonitoring(){
	if(misty.Get("BatteryCheckMode") == 0){
		try {
			misty.UnregisterEvent("BatteryLow");
		} catch(err) {}
	}
	else if(misty.Get("BatteryCheckMode") == 1){
		try {
			misty.UnregisterEvent("BatteryOK");
		} catch(err) {}
	}
	else{
		try {
			misty.UnregisterEvent("BatteryGood");
		} catch(err) {}
	}
}

//---------------- Handling the Battery Low event -----------------------------
function _BatteryLow(){
	// Terminate the event monitoring so it won't continue triggering until
	// the handling process is done
    misty.Debug("Low battery level detected");
	unregisterBatteryMonitoring();
	misty.PlayAudio("LowBattery.wav", 100);
	misty.Pause(2000);
	// Turn RED LED on
	misty.ChangeLED(255,0,0);
	// Unregister all sensors
	unregisterAll();
	unRegister_HazardNotification();
	misty.Stop();
	misty.Set("BatteryCheckMode",1);
	misty.Set("BatteryIsLow",true);
	registerBatteryMonitoring();
}

function _BatteryOK(){
	// Update the LED color code to indicate the battery level while charging
	unregisterBatteryMonitoring();
	// Turn YELLOW LED on
	misty.ChangeLED(255,255,0);
	misty.Set("BatteryCheckMode",2);
	registerBatteryMonitoring();
}

function _BatteryGood(){
	// Update the LED color code to indicate the battery level while charging
	unregisterBatteryMonitoring();
	// Turn YELLOW LED on
	misty.ChangeLED(0,255,0);
	misty.Set("BatteryCheckMode",0);
	misty.Set("BatteryIsLow",false);
	registerBatteryMonitoring();
}

//------------------------ Greeting by time of the day -------------------------
function timeGreeting(){
	var timeNow = new Date().getHours();
	if(timeNow < 12){
		misty.PlayAudio("Misty_Good_morning.wav");
	}
	else if(timeNow < 18){
		misty.PlayAudio("Misty_Good_afternoon.wav");
	}
	else{
		misty.PlayAudio("Misty_Good_evening.wav");
	}
	misty.Debug(JSON.stringify("Hour now: " + timeNow.toString()));
}

//------------------- Head arms motion control support functions ---------------------//

function bothArmsLU_RD()
{
    misty.MoveArms(-45, 45, 100, 100);
    misty.Pause(2000);
    misty.MoveArms(45, -45, 100, 100);
}

function bothArmsLD_RU()
{
    misty.MoveArms(45, -45, 100, 100);
    misty.Pause(2000);
    misty.MoveArms(-45, 45, 100, 100);
}

// for a demo with the best result, align Misty to true North 0/360 with compass and recycle power OFF/ON //
function register_YawIMU()
{
    misty.AddReturnProperty("YawIMU", "yaw"); 
    misty.RegisterEvent("YawIMU", "IMU", 0, true);
}

function unregister_YawIMU()
{
	try {
		misty.UnregisterEvent("YawIMU");
    } catch(err) {}
}

function _YawIMU(data)
{
    _YawToCompassConversionFactor = 0;
    var yawData = data.AdditionalResults[0];
    misty.Debug("IMU yaw data: " + yawData); 
    if(data !== undefined && data !== null) {
        // Parse data and assign it to a variable and handle the bug
        if(yawData > 1000)
            yawData = misty.Get("last_YawData");
        _last_Yaw = 360.0 - yawData;
        // Convert to compass data
        _CurrentCompass = Math.round(_last_Yaw - _YawToCompassConversionFactor);
        misty.Set("CurrentCompass", _CurrentCompass);
        misty.Set("last_YawData",yawData);
        misty.Debug("Current compass value: " + _CurrentCompass);
    }
}

//---------------- Customed Locomotive functions for good organized actions and accuracy -----------------//
function spinLeft()
{
    rotationTuning("Left",90);
}

function spinRight()
{
    rotationTuning("Right",90);
}

function spinLeft_360()
{
    rotationTuning("Left",90);
    rotationTuning("Left",270);
}

function spinRight_360()
{
    rotationTuning("Right",90);
    rotationTuning("Right",270);
}

function rotationTuning(direction, angle)
{
    var angular_velocity = 60;
    var target_direction_met = false;
    var retries = 0;
    var dest_heading = 0.0;
    var currentDelta = 0.0;
    var updatedCurrentCompass = misty.Get("CurrentCompass");
    var lastCompass = 0.0;
    var turningEnabled = true;
    var standingStillCount = 0;
    var compassDiff = 0.0;
    var totalRotationAngle = 0.0;
    var originalCompass = updatedCurrentCompass;

    if(direction == "Left"){
        dest_heading = updatedCurrentCompass - angle;
        if(dest_heading < 0)
            dest_heading += 360;
    }
    else{
        dest_heading = updatedCurrentCompass + angle;
        if(dest_heading > 360)
            dest_heading -= 360;
    }

    while(!target_direction_met && (retries < 150)){
        if(turningEnabled){
            if(direction == "Left"){
                misty.DriveTime(0,angular_velocity,10000);
            }
            else{
                misty.DriveTime(0,-angular_velocity,10000);
            }
            turningEnabled = false;
        }

        misty.Pause(150);
        updatedCurrentCompass = misty.Get("CurrentCompass");
        if(direction == "Left")
            compassDiff = originalCompass - updatedCurrentCompass;
        else
            compassDiff = updatedCurrentCompass -originalCompass;

        if(compassDiff < 0)
        compassDiff += 360;

        // Update the reference compass location
        originalCompass = updatedCurrentCompass;
        // make corrction for IMU error
        if(compassDiff == 0)
            totalRotationAngle += 3;
        else
            totalRotationAngle += compassDiff;
//            misty.Debug("Total turned angles: " + totalRotationAngle);
        currentDelta = angle - totalRotationAngle;

        // Check if current position is within the target or over the target
        if(currentDelta < 3){
            misty.Stop();
            target_direction_met = true;
        }
        else{
            retries += 1;
            misty.Debug("Target heading: " + dest_heading + " ,Delta: " + currentDelta);
            if(lastCompass == updatedCurrentCompass){
                standingStillCount += 1;
                if(standingStillCount > 10){
                    turningEnabled = true;
                    retries = 0;
                }
            }
            else{
                standingStillCount = 0;
                lastCompass = updatedCurrentCompass;
            }
        }
    }

    if(target_direction_met){
            misty.Debug("Tuning is successful");
    }
    else{
            misty.Debug("Tuning is not successful with " + retries + " retries");
            misty.Stop();
    }
    
    misty.Debug("Last Delta: " +  currentDelta);
}

function DriveForward()
{
    var linear_velocity = 40;
    var angular_velocity = 0.0;
    misty.DriveTime(linear_velocity,angular_velocity,2000);
}

function DriveForwardLeft()
{
    var linear_velocity = 60;
    var angular_velocity = 0.8 * linear_velocity;
    misty.DriveTime(linear_velocity,angular_velocity,3000);
}

function DriveForwardRight()
{
    var linear_velocity = 60;
    var angular_velocity = 0.8 * linear_velocity;
    misty.DriveTime(linear_velocity,-angular_velocity,3000);
}

function DriveInCycleCCW()
{
    var linear_velocity = 60;
    var angular_velocity = 0.3 * linear_velocity;
    misty.DriveTime(linear_velocity,angular_velocity,4000);
}

function DriveInCycleCW()
{
    var linear_velocity = 60;
    var angular_velocity = 0.3 * linear_velocity;
    misty.DriveTime(linear_velocity,-angular_velocity,4000);
}

function DriveBackward()
{
    var linear_velocity = -40;
    var angular_velocity = 0.0;
    misty.DriveTime(linear_velocity,angular_velocity,2000);
}
function DriveBackwardLeft()
{
    var linear_velocity = -60;
    var angular_velocity = 0.8 * linear_velocity;
    misty.DriveTime(linear_velocity,-angular_velocity,3000);
}

function DriveBackwardRight()
{
    var linear_velocity = -60.0;
    var angular_velocity = 0.8 * linear_velocity;
    misty.DriveTime(linear_velocity,angular_velocity,3000);
}

//-------------------------Register hazard notification function -----------------------------------------//
function register_HazardNotification()
{
    misty.AddReturnProperty("Hazard", "BumpSensorsHazardState");
    misty.AddReturnProperty("Hazard", "TimeOfFlightSensorsHazardState");
    misty.RegisterEvent("Hazard", "HazardNotification", 0, true);
}

function unRegister_HazardNotification()
{
    misty.UnregisterEvent("Hazard");
}

function _Hazard(data) {
    var safe = false;
    // Print HazardNotification event message & data from 
    // added return properties 
    misty.Debug(JSON.stringify(data));
    misty.Debug(JSON.stringify(data.AdditionalResults));
    const dataIn = data.AdditionalResults;
    // Push the name of each sensor that is in a hazard state
    // into an array called triggers
    var triggers = [];
    dataIn.forEach(sensor => {
        sensor.forEach(sensorData => {
            sensorData.InHazard ? triggers.push(sensorData.SensorName) : {}
        });
    });
    // If the triggers array is empty, it's safe to drive.
    // If there are elements in this array, Misty is in
    // a hazard state.
    triggers.length ? {} : safe = true;
    safe ? misty.ChangeLED(0, 255, 0) : misty.ChangeLED(255, 0, 0);
    if(!safe){
        misty.PlayAudio("s_Awe.wav");
    }
    misty.Debug(safe);
    misty.Debug(triggers);
    registerAll();
}


function secondsPast(value) {
	var timeElapsed = new Date() - new Date(value);
    timeElapsed /= 1000;
    return Math.round(timeElapsed); // seconds
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//--------------------------------------TOFs----------------------------------------------------------------

function _BackTOF(data) {

    misty.Debug("Back ToF sensor was triggered!");
	unregisterAll();
    misty.ChangeLED(255, 0, 255);
    misty.Set("tofTriggeredAt",(new Date()).toUTCString());
    misty.Set("tofTriggered", true);
	let backTOFData = data.PropertyTestResults[0].PropertyParent; 
	misty.Debug(JSON.stringify("Distance: " + backTOFData.DistanceInMeters)); 
	misty.Debug(JSON.stringify("Sensor Position: " + backTOFData.SensorPosition));
	misty.Drive(0,0,0, 200);
	misty.DriveTime(35, 0, 2500);
	misty.Pause(2500);
}

function _FrontTOF(data) {

    misty.Debug("Front ToF sensor was triggered!");
	unregisterAll();
    misty.ChangeLED(255, 255, 0);
    misty.Set("tofTriggeredAt",(new Date()).toUTCString());
    misty.Set("tofTriggered", true);
	let frontTOFData = data.PropertyTestResults[0].PropertyParent; 
	misty.Debug(JSON.stringify("Distance: " + frontTOFData.DistanceInMeters)); 
	misty.Debug(JSON.stringify("Sensor Position: " + frontTOFData.SensorPosition));
	misty.Drive(0,0,0, 200);
	misty.DriveTime(-35, 0, 2500);
    misty.Pause(1000);
//  Next dance move will change the direction per move plan
//	misty.DriveTime(0, 52, 2500);
//	misty.Pause(2500);
}

function _LeftTOF(data) {

    misty.Debug("Left ToF sensor was triggered!");
	unregisterAll();
    misty.ChangeLED(0, 255, 0);
    misty.Set("tofTriggeredAt",(new Date()).toUTCString());
    misty.Set("tofTriggered", true);
	let leftTOFData = data.PropertyTestResults[0].PropertyParent; 
	misty.Debug(JSON.stringify("Distance: " + leftTOFData.DistanceInMeters)); 
	misty.Debug(JSON.stringify("Sensor Position: " + leftTOFData.SensorPosition));
	misty.Drive(0,0,0, 200);
	misty.DriveTime(-35, 0, 2500);
	misty.Pause(1000);
//	misty.DriveTime(0, -52, 2500);	
//	misty.Pause(2500);
}

function _RightTOF(data) {

    misty.Debug("Right ToF sensor was triggered!");
	unregisterAll();
    misty.ChangeLED(0,255,255);
    misty.Set("tofTriggeredAt",(new Date()).toUTCString());
    misty.Set("tofTriggered", true);
	let rightTOFData = data.PropertyTestResults[0].PropertyParent; 
	misty.Debug(JSON.stringify("Distance: " + rightTOFData.DistanceInMeters)); 
	misty.Debug(JSON.stringify("Sensor Position: " + rightTOFData.SensorPosition));
	misty.Drive(0,0,0, 200);
	misty.DriveTime(-35, 0, 2500);
	misty.Pause(1000);
//	misty.DriveTime(0, 52, 2500);	
//	misty.Pause(2500);
}

//--------------------------------------Bump Sensor----------------------------------------------------------------

function _Bumped(data) {

	unregisterAll();
	misty.Set("tofTriggeredAt",(new Date()).toUTCString());
    misty.Set("tofTriggered", true);
    var sensor = data.AdditionalResults[0];
	misty.Debug(sensor);
	misty.Drive(0,0,0, 200);
    if (sensor === "Bump_FrontRight") {
        misty.Debug("Bump front right sensor was triggered!");
        misty.MoveArmDegrees("right", 45, 50);
        misty.ChangeLED(0, 255, 0);
		misty.DriveTime(-35, 0, 2500);
		misty.Pause(1000);
//		misty.DriveTime(0, 52, 2500);	
//		misty.Pause(2500);
	} else if (sensor === "Bump_FrontLeft") {
        misty.Debug("Bump front left sensor was triggered!");
        misty.MoveArmDegrees("left", 45, 50);
        misty.ChangeLED(255, 200,0);
		misty.Pause(1000);
		misty.DriveTime(0, -52, 2500);	
		misty.Pause(2500);
	} else if (sensor === "Bump_RearLeft") {
        misty.Debug("Bump rear left sensor was triggered!");
        misty.MoveHead(2, 0, 3, 60);
        misty.ChangeLED(0, 200,255);
		misty.DriveTime(35, 0, 2500);
		misty.Pause(1000);
//		misty.DriveTime(0, -52, 2500);
//		misty.Pause(2500);
	} else {
        misty.Debug("Bump rear right sensor was triggered!");
        misty.MoveHead(2, 0, -3, 60);
        misty.ChangeLED(0, 0,255);
		misty.DriveTime(35, 0, 2500);
		misty.Pause(1000);
//		misty.DriveTime(0, 52, 2500);	
//		misty.Pause(2500);
	}       
 }

 //--------------------------------------Easy Register and Unregister Event ----------------------------------------------

function registerAll() {
	// misty.AddPropertyTest(string eventName, string property, string inequality, string valueAsString, string valueType);
    // misty.RegisterEvent(string eventName, string messageType, int debounce, [bool keepAlive = false], [string callbackRule = “synchronous”], [string skillToCall = null]);
    // Enevent callback function names are event names prefixed with an underscore
	misty.AddPropertyTest("FrontTOF", "SensorPosition", "==", "Center", "string"); 
	misty.AddPropertyTest("FrontTOF", "DistanceInMeters", "<=", 0.15, "double"); 
	misty.RegisterEvent("FrontTOF", "TimeOfFlight", 0, false);

	misty.AddPropertyTest("LeftTOF", "SensorPosition", "==", "Left", "string"); 
	misty.AddPropertyTest("LeftTOF", "DistanceInMeters", "<=", 0.15, "double"); 
	misty.RegisterEvent("LeftTOF", "TimeOfFlight", 0, false);

	misty.AddPropertyTest("RightTOF", "SensorPosition", "==", "Right", "string"); 
	misty.AddPropertyTest("RightTOF", "DistanceInMeters", "<=", 0.15, "double"); 
	misty.RegisterEvent("RightTOF", "TimeOfFlight", 0, false);

	misty.AddPropertyTest("BackTOF", "SensorPosition", "==", "Back", "string"); 
	misty.AddPropertyTest("BackTOF", "DistanceInMeters", "<=", 0.05, "double"); 
	misty.RegisterEvent("BackTOF", "TimeOfFlight", 0, false);

	misty.AddReturnProperty("Bumped", "sensorName",);
    misty.RegisterEvent("Bumped", "BumpSensor", 250 ,true);

}

function unregisterAll(){

	try {
		misty.UnregisterEvent("FrontTOF");
	} catch(err) {}
	try {
		misty.UnregisterEvent("BackTOF");
	} catch(err) {}
	try {
		misty.UnregisterEvent("RightTOF");
	} catch(err) {}
	try {
		misty.UnregisterEvent("LeftTOF");
	} catch(err) {}
	try {
		misty.UnregisterEvent("Bumped");
	} catch(err) {}
}