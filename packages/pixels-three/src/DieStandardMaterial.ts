import * as THREE from "three";

export default class DieStandardMaterial extends THREE.MeshStandardMaterial {
  // private readonly _mapScale = { value: 0 };
  private readonly _numberColor = { value: new THREE.Vector4() };
  private readonly _ledIntensity = { value: 0 };

  constructor(
    normalMap: THREE.Texture,
    faceMap: THREE.Texture,
    ledIntensity: number,
    color = new THREE.Color(0x434343),
    numberColor = new THREE.Color(1, 1, 1),
    numberColorAlpha = 110 / 255,
    normalScale = new THREE.Vector2(0.2, 0.2)
  ) {
    super();

    // Standard parameters
    this.color = color;
    this.emissive = new THREE.Color(0);
    this.roughness = 0.8; // Unity has glossiness = 0.414
    this.metalness = 0.666; // Unity has glossiness = 0.666
    this.normalScale = normalScale;

    // Custom parameters
    // this._mapScale.value = 10000;
    this._numberColor.value = new THREE.Vector4(
      numberColor.r,
      numberColor.g,
      numberColor.b,
      numberColorAlpha
    );
    this._ledIntensity.value = ledIntensity;

    // Textures
    this.normalMap = normalMap;
    this.emissiveMap = faceMap;

    // Modify shader
    this.onBeforeCompile = (shader) => {
      // shader.uniforms.mapScale = this._mapScale;
      shader.uniforms.numberColor = this._numberColor;
      shader.uniforms.ledIntensity = this._ledIntensity;
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <uv_pars_vertex>",
          `
            out vec3 vCoords;
            #include <uv_pars_vertex>
          `
        )
        .replace(
          "#include <begin_vertex>",
          `
            #include <begin_vertex>
            vCoords = position;
          `
        );

      shader.fragmentShader =
        `
          in vec3 vCoords;

          // uniform float mapScale;
          uniform vec4 numberColor;
          uniform sampler2D glowTex;
          uniform float ledIntensity;
        ` +
        shader.fragmentShader
          // Some tests with tri-planar shading
          // .replace(
          //   "#include <normalmap_pars_fragment>",
          //   `
          //     #include <normalmap_pars_fragment>

          //     #if defined(TANGENTSPACE_NORMALMAP)
          //     vec2 normal_dHdxy_fwd() {
          //       vec2 dSTdx = dFdx( vUv );
          //       vec2 dSTdy = dFdy( vUv );
          //       float Hll = normalScale.x * texture2D( normalMap, vUv ).x;
          //       float dBx = normalScale.x * texture2D( normalMap, vUv + dSTdx ).x - Hll;
          //       float dBy = normalScale.x * texture2D( normalMap, vUv + dSTdy ).x - Hll;
          //       return vec2( dBx, dBy );
          //     }
          //     #elif defined(USE_BUMPMAP)
          //     vec2 bump_dHdxy_fwd() {
          //       vec2 dSTdx = dFdx( vUv );
          //       vec2 dSTdy = dFdy( vUv );
          //       float Hll = bumpScale * texture2D( bumpMap, vUv ).x;
          //       float dBx = bumpScale * texture2D( bumpMap, vUv + dSTdx ).x - Hll;
          //       float dBy = bumpScale * texture2D( bumpMap, vUv + dSTdy ).x - Hll;
          //       return vec2( dBx, dBy );
          //     }
          //     #endif
          //   `
          // )
          // .replace(
          //   "#include <map_fragment>",
          //   `
          //     #ifdef USE_MAP
          //       // Blending factor of triplanar mapping
          //       vec3 bf = normalize(abs(vNormal));
          //       bf /= dot(bf, vec3(1.0));

          //       // Tri-planar mapping
          //       vec2 tx = vCoords.yz * mapScale;
          //       vec2 ty = vCoords.zx * mapScale;
          //       vec2 tz = vCoords.xy * mapScale;

          //       // Base color
          //       vec4 cx = texture2D(map, tx) * bf.x;
          //       vec4 cy = texture2D(map, ty) * bf.y;
          //       vec4 cz = texture2D(map, tz) * bf.z;

          //       diffuseColor *= cx + cy + cz;
          //     #endif
          //   `
          // )
          // .replace(
          //   "#include <normal_fragment_maps>",
          //   `
          //     #if defined(TANGENTSPACE_NORMALMAP)
          //       // Normal map
          //       vec4 nx = texture2D(normalMap, tx) * bf.x;
          //       vec4 ny = texture2D(normalMap, ty) * bf.y;
          //       vec4 nz = texture2D(normalMap, tz) * bf.z;
          //       vec3 mapN = (nx + ny + nz).xyz * 2.0 - 1.0;
          //       // vec3 mapN = texture2D(normalMap, vUv).xyz * 2.0 - 1.0;
          //       // mapN.xy *= normalScale;
          //       #ifdef USE_TANGENT
          //         normal = normalize(vTBN * mapN);
          //       #else
          //         // normal = perturbNormal2Arb(-vViewPosition, normal, mapN, faceDirection);
          //         normal = perturbNormalArb(-vViewPosition, normal, normal_dHdxy_fwd(), faceDirection);
          //       #endif
          //     #elif defined(USE_BUMPMAP)
          //       normal = perturbNormalArb(-vViewPosition, normal, bump_dHdxy_fwd(), faceDirection);
          //     #endif
          //   `
          // )
          .replace(
            // Replace the emissive fragment with our special glow
            "#include <emissivemap_fragment>",
            `
              #ifdef USE_EMISSIVEMAP
                  vec2 glowUv = vec2(vUv.x, 1.0 - vUv.y);
                  vec4 glowMask = texture2D(emissiveMap, glowUv);
                  totalEmissiveRadiance *= glowMask.a;

                  float glowStrength = dot(emissive.rgb, vec3(0.299, 0.587, 0.114));
                  float numberStrength = glowMask.r * (1.0 - glowStrength) * numberColor.a;
                  diffuseColor.rgb = numberColor.rgb * numberStrength + diffuseColor.rgb * (1.0 - numberStrength);
              #endif
            `
          )
          .replace(
            // Add LED light
            "#include <lights_fragment_begin>",
            `
              #include <lights_fragment_begin>
            
              // Light simulating the LED
              vec3 ledPosInView = vec3(0, 0, -110);
              // TODO get mesh normal
              directLight.direction = normalize(ledPosInView - geometry.position);
              directLight.color = ledIntensity * emissive;
              directLight.visible = true;
              RE_Direct(directLight, geometry, material, reflectedLight);
            `
          );
    };
  }
}
