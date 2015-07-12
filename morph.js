var Morph = {

    vertices: [],

    triangles: [],
    bones: [],
    drawTriangle: function (tri) {
        var ctx = this.ctx;
        this.transformVertex(tri.p1);
        this.transformVertex(tri.p2);
        this.transformVertex(tri.p3);

        var x0 = tri.p1.x,
            y0 = tri.p1.y,
            x1 = tri.p2.x,
            y1 = tri.p2.y,
            x2 = tri.p3.x,
            y2 = tri.p3.y,
            u0 = tri.p1.sx,
            v0 = tri.p1.sy,
            u1 = tri.p2.sx,
            v1 = tri.p2.sy,
            u2 = tri.p3.sx,
            v2 = tri.p3.sy;


        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.closePath();
        //ctx.stroke();
        ctx.clip();

        x1 -= x0;
        y1 -= y0;
        x2 -= x0;
        y2 -= y0;
        u1 -= u0;
        v1 -= v0;
        u2 -= u0;
        v2 -= v0;
        var id = 1.0 / (u1 * v2 - u2 * v1);
        var a = id * (v2 * x1 - v1 * x2);
        var b = id * (v2 * y1 - v1 * y2);
        var c = id * (u1 * x2 - u2 * x1);
        var d = id * (u1 * y2 - u2 * y1);
        var e = x0 - a * u0 - c * v0;
        var f = y0 - b * u0 - d * v0;

        ctx.transform(a, b, c, d, e, f);
        ctx.drawImage(this.image, 0, 0);

        ctx.restore();

    },

    transformVertex: function (vertex) {
        var bone = vertex.bone;
        if (!bone) {
            return;
        }


        var getDistance = function (x0, y0, x1, y1) {
            return Math.sqrt(Math.pow(x0 - x1, 2) + Math.pow(y0 - y1, 2));
        }

        var getMidPoint = function (x0, y0, x1, y1) {
            return {
                x: (x0 + x1) / 2,
                y: (y0 + y1) / 2
            }
        }

        var getAngle = function (x0, y0, x1, y1) {
            return Math.atan2(y0 - y1, x0 - x1);
        }


        var a = 1, b = 0, c = 0, d = 0, e = 1, f = 0;

        var distance = getDistance(bone.head.sx, bone.head.sy, bone.tail.sx, bone.tail.sy);
        var distance2 = getDistance(bone.head.x, bone.head.y, bone.tail.x, bone.tail.y);


        a = e = distance2 / distance;

        //

        var angle1 = getAngle(bone.head.sx, bone.head.sy, bone.tail.sx, bone.tail.sy);
        var angle2 = getAngle(bone.head.x, bone.head.y, bone.tail.x, bone.tail.y);

        var phi = angle1 - angle2;
        a = Math.cos(phi) * a;
        e = Math.cos(phi) * e;
        b = Math.sin(phi);
        d = -Math.sin(phi);


        var m1 = getMidPoint(bone.head.sx, bone.head.sy, bone.tail.sx, bone.tail.sy);
        var m2 = getMidPoint(bone.head.x, bone.head.y, bone.tail.x, bone.tail.y);
        c = (m2.x - m1.x);
        f = (m2.y - m1.y);


        //xout = r00* xin + r01* yin + x - r00*x - r01*y
        //c =   bone.head.x - bone.head.sx;
        //f =   bone.head.y - bone.head.sy;
        $('#scale').html(bone.head.x + ' ' + m2.x + ' ' + bone.tail.x);

        vertex.x = (vertex.sx - m1.x) * a + (vertex.sy - m1.y) * b + c +m1.x;
        vertex.y = (vertex.sx - m1.x) * d + (vertex.sy - m1.y) * e + f +m1.y;


        //bone.tail.x = bone.tail.sx * a + b * bone.tail.sy + c;

    },

    addVertex: function (x, y, bone) {
        var v = {
            x: x,
            y: y,
            sx: x,
            sy: y,
            bone: bone
        };

        this.vertices.push(v);
        this.triangulate();
        return v;
    },

    triangulate: function () {
        var triangles = this.triangles = [];

        var _triangles = Delaunay.triangulate(_.map(this.vertices, function (vertex) {
            return [vertex.x, vertex.y];
        }));

        for (var i = 0; i < _triangles.length - 2; i += 3) {

            triangles.push({
                p1: this.vertices[_triangles[i]],
                p2: this.vertices[_triangles[i + 1]],
                p3: this.vertices[_triangles[i + 2]]
            });
        }


    },
    setCanvas: function (canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');


        var self = this;
        $(canvas).mousedown(function (e) {
            if (self.currentBehavior) {
                self.behaviors[self.currentBehavior].down.call(self, e);
            }
        }).mousemove(function (e) {
                if (self.currentBehavior) {
                    self.behaviors[self.currentBehavior].move.call(self, e);
                }
            }).mouseup(function (e) {
                if (self.currentBehavior) {
                    self.behaviors[self.currentBehavior].up.call(self, e);
                }
            });
    },
    loadImage: function (url) {
        var self = this;
        var image = new Image();
        image.src = url;
        this.image = image;
        //console.log(image);
        image.onload = function () {
            self.canvas.width = image.width;
            self.canvas.height = image.height;
        }
    },
    render: function () {
        var ctx = this.ctx;
        var self = this;

        requestAnimationFrame(function () {
            self.canvas.width = self.canvas.width;
            self.ctx.drawImage(self.image, 0, 0);


            _.each(self.triangles, function (tri) {
                self.drawTriangle(tri);
            });
            _.each(self.vertices, function (v) {
                ctx.fillStyle = '#00f';
                ctx.fillRect(v.x - 2, v.y - 2, 5, 5);
            });

            _.each(self.bones, function (bone) {
                ctx.strokeStyle = '#f00';
                ctx.beginPath();
                ctx.moveTo(bone.head.x, bone.head.y);
                ctx.lineTo(bone.tail.x, bone.tail.y);
                ctx.closePath();
                ctx.stroke();
            });

            self.render();
        });
    },
    vertexSelectDistance: 5,

    addTrianglesForBone: function (bone, e) {
        if (bone) {
            bone.tail.sx = bone.tail.x = e.offsetX;
            bone.tail.sy = bone.tail.y = e.offsetY;
        }
    },


    behaviors: {
        moveVertex: {
            down: function (e) {
                var self = this;
                _.each(self.vertices, function (vertex) {
                    var distance = Math.sqrt(Math.pow(vertex.x - e.offsetX, 2) + Math.pow(vertex.y - e.offsetY, 2));
                    //console.log(distance);
                    if (distance < self.vertexSelectDistance) {
                        self.startEvent = e;
                        self.currentVertex = vertex;
                        self.startX = vertex.x;
                        self.startY = vertex.y;
                        return false;
                    }
                });
            },
            move: function (e) {
                var self = this;
                if (self.currentVertex) {
                    var dx = e.offsetX - self.startEvent.offsetX;
                    var dy = e.offsetY - self.startEvent.offsetY;
                    self.currentVertex.x = dx + self.startX;
                    self.currentVertex.y = dy + self.startY;
                }
            },
            up: function (e) {
                var self = this;
                if (self.currentVertex) {
                    console.log(self.currentVertex.x, self.currentVertex.y);
                }
                self.currentVertex = undefined;
            }
        },
        drawBone: {

            down: function (e) {

                this.currentBone = {
                    head: {
                        x: e.offsetX,
                        y: e.offsetY,
                        sx: e.offsetX,
                        sy: e.offsetY
                    },
                    tail: {
                        x: e.offsetX,
                        y: e.offsetY
                    }
                };
                this.bones.push(this.currentBone);
                this.startEvent = e;
            },
            move: function (e) {
                this.addTrianglesForBone(this.currentBone, e);
            },
            up: function (e) {
                this.addTrianglesForBone(this.currentBone, e);
                console.log(this.currentBone);
                this.currentBone = undefined;
            }
        },
        poseBone: {

            down: function (e) {
                var self = this;
                _.each(self.bones, function (bone) {
                    _.each([bone.head, bone.tail], function (vertex) {
                        var distance = Math.sqrt(Math.pow(vertex.x - e.offsetX, 2) + Math.pow(vertex.y - e.offsetY, 2));
                        //console.log(distance);
                        if (distance < self.vertexSelectDistance) {
                            self.startEvent = e;
                            self.currentVertex = vertex;
                            self.startX = vertex.x;
                            self.startY = vertex.y;
                            return false;
                        }
                    });
                    if (self.currentVertex) {
                        self.currentBone = bone;
                        return false;
                    }
                });
            },
            move: function (e) {
                var self = this;
                if (self.currentVertex) {
                    var dx = e.offsetX - self.startEvent.offsetX;
                    var dy = e.offsetY - self.startEvent.offsetY;
                    self.currentVertex.x = dx + self.startX;
                    self.currentVertex.y = dy + self.startY;
                }
            },
            up: function (e) {
                this.currentVertex = undefined;
            }
        },
        drawVertex: {

            down: function (e) {

            },
            move: function (e) {

            },
            up: function (e) {
                this.addVertex(e.offsetX, e.offsetY, this.currentBone);
                console.log(e.offsetX, e.offsetY);
            }
        }
    },
    currentBehavior: undefined

};


$(function () {
    Morph.setCanvas($('#canvas')[0]);
    Morph.loadImage('example.png');


    Morph.render();


    Morph.currentBehavior = 'poseBone';
    /*
     tail: {
     x: 185,
     y: 199,
     sx: 185,
     sy: 199
     },
     */
    Morph.currentBone = {
        tail: {
            x: 185,
            y: 199,
            sx: 185,
            sy: 199
        },
        head: {
            x: 186,
            y: 57,
            sx: 186,
            sy: 57
        }
    };
    Morph.bones.push(Morph.currentBone);


    Morph.addVertex(257, 192, Morph.currentBone);
    Morph.addVertex(254, 154, Morph.currentBone);
    Morph.addVertex(261, 98, Morph.currentBone);
    Morph.addVertex(258, 44, Morph.currentBone);
    Morph.addVertex(233, 8, Morph.currentBone);
    Morph.addVertex(204, 1, Morph.currentBone);
    Morph.addVertex(158, 4, Morph.currentBone);
    Morph.addVertex(129, 26, Morph.currentBone);
    Morph.addVertex(120, 71, Morph.currentBone);
    Morph.addVertex(114, 107, Morph.currentBone);
    Morph.addVertex(107, 144, Morph.currentBone);
    Morph.addVertex(99, 161, Morph.currentBone);
    Morph.addVertex(180, 185, Morph.currentBone);
    Morph.addVertex(183, 141, Morph.currentBone);
    Morph.addVertex(193, 65, Morph.currentBone);
    Morph.addVertex(195, 26, Morph.currentBone);
    Morph.addVertex(189, 105, Morph.currentBone);
    //Morph.addVertex()


    $('#draw_vertex').click(function () {
        Morph.currentBehavior = 'drawVertex';
    });

    $('#move_vertex').click(function () {
        Morph.currentBehavior = 'moveVertex';
    });

    $('#draw_bone').click(function () {
        Morph.currentBehavior = 'drawBone';
        Morph.currentBone= undefined;
    });

    $('#pose_bone').click(function () {
        Morph.currentBehavior = 'poseBone';
    });

    //console.log(e);


});