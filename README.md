# Misty-Dance-Skill
Demonstrate a dancing skill for Misty robot

//------------------------------------------------------------------------//

Misty Dance skill with iceskating moves - by Phillip Ha
Misty moves and poses along the inspired song "I will survive" sung by
the famous singer Gloria Gaynor
Revised version: 11/03/2019 for some command parameters updated in new
firmware version 1.4.4.0. 
This skill is created to demonstrate the utilization of 
the essential support functions.  They can be used to
build more advanced skills. This skill include
- Battery health check to allow locomotive functions to run
- Using the available API driving functions to make the dance moves
  following the song mood
- Obstacle avoidance using all available sensors. For soft carpet, 
  this can be turned off or not used to prevent false detection from ToF sensors
- Hazard notification to indicate the situation where Misty's
  sensors detect hazard condition/threshold triggered.  For open safe demo space,
  this event notification also can be bypassed to avoid any interruption to the dance 
  move 
- Using head and arm movement to show poses
- LEDs usage with mulitple colors setting in the sensors' callbacks

//------------------------------------------------------------------------//

Usage:
1. Use the Skill Runner software from Misty Robotics to upload the Jave and JSON code files to Misty II robot
2. Select MistyDance Skill and click run button to start the Misty Dance skill demo.  The sequence and timing
   are optimized for the carpet floor and for the "I will survive" song.  Please note that, overtime when there're
   new software/ firmware updates pushed to Misty II. The behavior may change and require to make any adjustments 
   as needed. 
   
   A video for this Misty Dance demo can be seen here https://www.youtube.com/watch?v=Mu88Jo7wYnI
   
