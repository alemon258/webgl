window.onload = loadScene

var canvas,gl,
    cw, ch,
    vertices,
    thetaArr,//角度
    radiusArr,//半径
    velThetaArr,//旋转角度
    randomTargetXArr,//消失的位置x
    randomTargetYArr,//消失的位置y
    maxnum = 40000,
    drawType = 0


function loadScene(){
    canvas = document.getElementById('c')

    gl = canvas.getContext('experimental-webgl')

    if(!gl){
        alert("There's no WebGL context available.")
        return
    }

    cw = window.innerWidth
    ch = window.innerHeight
    canvas.width = cw
    canvas.height = ch

    gl.viewport(0, 0, cw, ch)

    //-----------------shader--------------------------
    var vertexShaderScript = document.getElementById("shader-vs")
    var vertexShader = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vertexShader, vertexShaderScript.text)
    gl.compileShader(vertexShader)
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      alert("Couldn't compile the vertex shader")
      gl.deleteShader(vertexShader)
      return
    }

    var fragmentShaderScript = document.getElementById("shader-fs")
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fragmentShader, fragmentShaderScript.text)
    gl.compileShader(fragmentShader)
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
        alert("Couldn't compile the fragment shader")
        gl.deleteShader(fragmentShader)
        return
    }
    //-------------------------------------------------------


    //------------------shader program------------------------------------
    gl.program = gl.createProgram()
    gl.attachShader(gl.program, vertexShader)
    gl.attachShader(gl.program, fragmentShader)
    gl.linkProgram(gl.program)
    if(!gl.getProgramParameter(gl.program, gl.LINK_STATUS)){
        alert("Unable to initialise shaders")
        gl.deleteProgram(gl.program)
        gl.deleteProgram(vertexShader)
        gl.deleteProgram(fragmentShader)
        return;
    }

    gl.useProgram(gl.program)
    // //    Get the vertexPosition attribute from the linked shader program
    // var vertexPosition = gl.getAttribLocation(gl.program, 'vertexPosition')

    // gl.enableVertexAttribArray(vertexPosition)
    //    Set clear color to black, fully opaque
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    //    Clear the depth buffer. The value specified is clamped to the range [0,1].
    //    More info about depth buffers: http://en.wikipedia.org/wiki/Depth_buffer
    gl.clearDepth(1.0)

    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE)



    //    Now create a shape.
    //    First create a vertex buffer in which we can store our data.
    var vertexBuffer = gl.createBuffer()
    //    Bind the buffer object to the ARRAY_BUFFER target.
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    //    Specify the vertex positions (x, y, z)

    // ------------------

    setup()

    // ------------------

    vertices = new Float32Array(vertices)

    //  gl.STATIC_DRAW：表示只会向缓存区对象写入一次数据，但需要绘制很多次；
    //  gl.STREAM_DRAW：表示只会向缓存区对象写入一次数据，然后绘制若干次；
    //  gl.DYNAMIC_DRAW：表示会向缓存区对象多次写入数据，并绘制很多次
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW)

    //    Clear the color buffer and the depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)


    //    Define the viewing frustum parameters
    //    More info: http://en.wikipedia.org/wiki/Viewing_frustum
    //    More info: https://knol.google.com/k/view-frustum
    var fieldOfView = 30.0
    var aspectRatio = canvas.width / canvas.height
    var nearPlane = 1.0
    var farPlane = 10000.0
    var top = nearPlane * Math.tan(fieldOfView * Math.PI / 360.0)
    var bottom = -top
    var right = top * aspectRatio
    var left = -right
  
    //     Create the perspective matrix. The OpenGL function that's normally used for this,
    //     glFrustum() is not included in the WebGL API. That's why we have to do it manually here.
    //     More info: http://www.cs.utk.edu/~vose/c-stuff/opengl/glFrustum.html
    var a = (right + left) / (right - left)
    var b = (top + bottom) / (top - bottom)
    var c = (farPlane + nearPlane) / (farPlane - nearPlane)
    var d = (2 * farPlane * nearPlane) / (farPlane - nearPlane)
    var x = (2 * nearPlane) / (right - left)
    var y = (2 * nearPlane) / (top - bottom)
    //透视矩阵
    var perspectiveMatrix = [
        x, 0, a, 0,
        0, y, b, 0,
        0, 0, c, d,
        0, 0, -1, 0
    ]

    //屏幕坐标系
    //  [           1           ]
    //  [                       ]
    //  [-cw/ch     0      cw/ch]
    //  [                       ]
    //  [           1           ]
  
    //     Create the modelview matrix
    //     More info about the modelview matrix: http://3dengine.org/Modelview_matrix
    //     More info about the identity matrix: http://en.wikipedia.org/wiki/Identity_matrix
    var modelViewMatrix = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]
    //     Get the vertex position attribute location from the shader program
    var vertexPosAttribLocation = gl.getAttribLocation(gl.program, "vertexPosition")
    //				colorLoc = gl.getVaryingLocation(gl.program, "vColor");
    //				alert("color loc : " + colorLoc );
    //     Specify the location and format of the vertex position attribute
    gl.vertexAttribPointer(vertexPosAttribLocation, 3.0, gl.FLOAT, false, 0, 0)
    //gl.vertexAttribPointer(colorLoc, 4.0, gl.FLOAT, false, 0, 0);
    //     Get the location of the "modelViewMatrix" uniform variable from the
    //     shader program
    gl.enableVertexAttribArray(vertexPosAttribLocation)

    var uModelViewMatrix = gl.getUniformLocation(gl.program, "modelViewMatrix")
    //     Get the location of the "perspectiveMatrix" uniform variable from the
    //     shader program
    var uPerspectiveMatrix = gl.getUniformLocation(gl.program, "perspectiveMatrix")
    //     Set the values
    gl.uniformMatrix4fv(uModelViewMatrix, false, new Float32Array(perspectiveMatrix))
    gl.uniformMatrix4fv(uPerspectiveMatrix, false, new Float32Array(modelViewMatrix))
    //	gl.varyingVector4fv(
    //     Draw the triangles in the vertex buffer. The first parameter specifies what
    //     drawing mode to use. This can be GL_POINTS, GL_LINE_STRIP, GL_LINE_LOOP,
    //     GL_LINES, GL_TRIANGLE_STRIP, GL_TRIANGLE_FAN, GL_TRIANGLES, GL_QUAD_STRIP,
    //     GL_QUADS, and GL_POLYGON
    //gl.drawArrays( gl.LINES, 0, numLines );
    //gl.flush();
  
    //setInterval( drawScene, 1000 / 40 );
    animate()
    setTimeout(timer, 1500)
  
}

function animate(){
    requestAnimationFrame(animate)
    drawScene()
}

function drawScene(){
    draw()

    gl.lineWidth(1);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //gl.drawArrays( gl.LINES_STRIP, 0, numLines );
    gl.drawArrays(gl.LINES, 0, maxnum);
    //gl.drawArrays( gl.QUAD_STRIP, 0, numLines );

    gl.flush();
    
}

function setup(){
    vertices = []
    thetaArr = []
    radiusArr = []
    velThetaArr = []
    randomTargetXArr = []
    randomTargetYArr = []

    for(let i = 0; i < maxnum; i++){
        let radius = (0.1 + .2 * Math.random())
        let theta = Math.random() * Math.PI * 2
        let velTheta = Math.random() * Math.PI / 15
        let randomPosX = (Math.random() * 2 - 1) * cw / ch
        let randomPosY = (Math.random() * 2 - 1) 

        //半径一样的两点，连成一条线
        vertices.push(radius * Math.cos(theta), radius * Math.sin(theta), 1.83)
        vertices.push(radius * Math.cos(theta), radius * Math.sin(theta), 1.83)

        thetaArr.push(theta)

        radiusArr.push(radius)

        velThetaArr.push(velTheta)

        randomTargetXArr.push(randomPosX)
        randomTargetYArr.push(randomPosY)
    }
}

function draw(){
    switch (drawType) {
        case 0:
          draw0()
          break
        case 1:
          draw1()
          break
        case 2:
          draw2()
          break
      }
}

function draw0(){
  
    for(let i = 0; i < maxnum * 2; i += 2){
        let bp = i * 3

        vertices[bp] = vertices[bp + 3]
        vertices[bp + 1] = vertices[bp + 4]

        num = parseInt(i / 2)
        let radius = radiusArr[num]
        let theta = thetaArr[num]
        theta = theta +  velThetaArr[num]
        thetaArr[num] = theta

        let targetX = radius * Math.cos(theta)
        let targetY = radius * Math.sin(theta)

        let px = vertices[bp + 3]
        let py = vertices[bp + 4]
        px += (targetX - px) * (Math.random() * .1 + .1)
        py += (targetY - py) * (Math.random() * .1 + .1)
        vertices[bp + 3] = px
        vertices[bp + 4] = py

    }
}

function draw1(){
    for(let i = 0; i < maxnum * 2; i += 2){
        let bp = i * 3

        vertices[bp] = vertices[bp + 3]
        vertices[bp + 1] = vertices[bp + 4]

        let num = parseInt(i / 2)
        let theta = thetaArr[num]
        let radius = radiusArr[num]

        theta = theta + velThetaArr[num]
        thetaArr[num] = theta

        let px = vertices[bp + 3]
        let py = vertices[bp + 4]
        px += radius * Math.cos(theta) * .1
        py += radius * Math.sin(theta) * .1
        vertices[bp + 3] = px
        vertices[bp + 4] = py
    }
}

function draw2(){
    for(let i = 0; i < maxnum * 2; i += 2){
        let bp = i * 3

        vertices[bp] = vertices[bp + 3]
        vertices[bp + 1] = vertices[bp + 4]

        let num = parseInt(i / 2)
        let targetX = randomTargetXArr[num]
        let targetY = randomTargetYArr[num]

        let px = vertices[bp + 3]
        let py = vertices[bp + 4]
        px += (targetX - px) * (Math.random() * .1 + .1)
        py += (targetY - py) * (Math.random() * .1 + .1)
        vertices[bp + 3] = px
        vertices[bp + 4] = py
    }
}

function timer() {
    drawType = (drawType + 1) % 3
  
    setTimeout(timer, 1500)
}