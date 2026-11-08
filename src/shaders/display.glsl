precision highp float;
varying vec2 vUv;
uniform sampler2D uDye, uLogoTexture, uDistance;
uniform float uRest, uFlood, uTime, uAspectRatio;
uniform vec3 uBackground, uPaper;
float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p) {
    vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
float cloud(vec2 p) {
    float n=0., a=.5;
    for(int i=0;i<4;i++){ n+=noise(p)*a;p=mat2(.8,-.6,.6,.8)*p*2.03+7.1;a*=.5; }
    return n/.9375;
}
void main() {
    vec2 displacement=texture2D(uDye,vUv).xy;
    vec2 uv=clamp(vUv-displacement, .001,.999);
    float original=texture2D(uLogoTexture,vUv).a;
    float pigment=texture2D(uDye,vUv).z;
    float density=mix(pigment,original,uRest);
    float aa=max(fwidth(density),.002);
    float mark=smoothstep(.5-aa,.5+aa,density);
    float ink=mark;
    if(uFlood>.0001) {
        vec2 plane=(vUv-vec2(.5,.54))*vec2(uAspectRatio,1.);
        float movement=sin(uFlood*3.14159265);
        vec2 drift=vec2(uTime*.035,-uTime*.022);
        vec2 flow=vec2(cloud(plane*3.+drift),cloud(plane*3.+4.7-drift))-.5;
        vec2 sampleUV=clamp(uv-flow*.06*movement,.001,.999);
        vec2 packed=texture2D(uDistance,sampleUV).rg;
        float sd=((packed.r*65280.+packed.g*255.)/65535.-.5)*4.;
        float radius=pow(uFlood,1.25)*length(vec2(uAspectRatio,1.))* .69;
        float veins=cloud(plane*7.+flow*2.+drift);
        float lobes=cloud(plane*3.4+flow+uFlood*.8);
        float reach=radius*(.76+.48*lobes);
        float edge=sd-reach;
        float fringe=.012+movement*.12;
        float core=1.-smoothstep(-.008,.008,edge);
        float wash=(1.-smoothstep(-fringe,fringe,edge-fringe*.65))*(.2+.45*veins);
        float wet=max(core,wash);
        wet=mix(wet,1.,smoothstep(.89,1.,uFlood));
        ink=mix(mark,max(mark,wet),smoothstep(0.,.035,uFlood));
    }
    gl_FragColor=vec4(mix(uBackground,uPaper,clamp(ink,0.,1.)),1.);
}
