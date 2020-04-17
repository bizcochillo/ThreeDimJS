3D Javascript play with three.js

After experimenting a little with threeJS I managed to have a very basic playground for creating circuits using elemental operations as: 
- Establish header position (Parameters x, y, z, orientation). 
- Add linear segment in the direction of the header (Parameters length). 
- Add segment with horizontal slope (XY) (Parameters length, angleInGrads).
- Add segment with vertical slope (XZ) (Parameters length, angleInGrads).
- Add turn to left segment (No parameters). 
- Add turn to right segment (No parameters). 

I like to set the following goals: 

* Refactor the code base to avoid global objects, improve encapsulation and prepare to test math operations (Not implement in the first phase).

* Create a raw format for the two circuits example. (No error handling at the first shot, added with testing)
  - Establish header position (Parameters x, y, z, orientation).
      M x y z direction
  - Add linear segment in the direction of the header (Parameters length).
      F length
  - Add segment with horizontal slope (XY) (Parameters length, angleInGrads).
      H length degrees    
  - Add segment with vertical slope (XZ) (Parameters length, angleInGrads).
      V length degrees
  - Add turn to left segment (No parameters). 
      L 
  - Add turn to right segment (No parameters). 
      R
  For instance: M 0 0 0 N,F 30,L,F 100,V 30,F 100,H -30,F10

* Relate the graphic object with a business object to be manipulated and keep them sync. 

* Add GUI support for viewing the format, the objects and similar stuff. 

* Reset the camera to the origin 

