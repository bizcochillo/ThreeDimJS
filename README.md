# 3D Javascript play with three.js

## Goals
Experiment with 3D graphics using WebGL via Three JS
Experiment with DOM manipulation with a Vanilla JS approach. 
Study basic code organization for JS code base. You know, everything goes tangled very easilty while manipulating DOM and keep sync with models and other stuff. 
Set a play arena for future investigations. 

## Description
JS client application able to create circuits based on the following very basic set of operations: 
- Establish header position (Parameters x, y, z, orientation). Token: `M x y z` direction (e. g. `M 0 0 0 S`)   
- Add linear segment in the direction of the header (Parameters length). Token: `F length` (e. g. `F 20`)
- Add segment with horizontal slope (XY) (Parameters length, angleInGrads). Token: `H length degrees`    
- Add segment with vertical slope (XZ) (Parameters length, angleInGrads).Token:  `V length degrees`
- Add turn to left segment (No parameters). Token: `L` 
- Add turn to right segment (No parameters). Token: `R`

Example circuit:  `M 0 0 0 N,F 30,L,F 100,V 30,F 100,H -30,F10`

![3D JS](https://github.com/bizcochillo/ThreeDimJS/blob/master/img/screenshot.png?raw=true)

For localtunnel use backup server if problems: 
- `lt -h "http://serverless.social" -p PORT`

- Collapse Side panel from https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_collapse_sidepanel
- Select style from https://www.filamentgroup.com/lab/select-css.html

