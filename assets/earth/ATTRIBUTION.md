# Earth visual assets and licenses

This directory supports the layered Earth visual used on the Lingdi GEO home pages.

## Solar System Scope Earth textures

- Creator / publisher: Solar System Scope, operated by INOVE, s.r.o.
- Source page: https://edu.solarsystemscope.com/textures/
- License: Creative Commons Attribution 4.0 International (CC BY 4.0)
- License deed: https://creativecommons.org/licenses/by/4.0/
- Retrieved: 2026-08-20
- Source basis disclosed by the publisher: NASA elevation and imagery data, including adjusted and merged NASA Blue Marble material.
- Endorsement boundary: use of these textures does not imply endorsement of Lingdi, this site, or its services by Solar System Scope, INOVE, or NASA.

### Official source files

| Texture | Official URL | Original format | Original SHA-256 |
|---|---|---:|---|
| Day | https://edu.solarsystemscope.com/textures/download/2k_earth_daymap.jpg | JPEG, 2048×1024 | `767ee1dc6eb3802699bfccf6f264880f8acd0b80de3191cd24984fe279b07b7c` |
| Night | https://edu.solarsystemscope.com/textures/download/2k_earth_nightmap.jpg | JPEG, 2048×1024 | `c16fd1bc096ab91a5c5265c6ff9847c43f489f2e2ee790ccdbcbd03251cf3a5a` |
| Clouds | https://edu.solarsystemscope.com/textures/download/2k_earth_clouds.jpg | JPEG, 2048×1024 | `fffd7f68d41b37274822150e54a6ef605af1d3ec35624d9f628c3b896bfa42ed` |
| Normal | https://edu.solarsystemscope.com/textures/download/2k_earth_normal_map.tif | TIFF, 2048×1024 | `f518ce2646ca935dbc17e316041de4fea7a5da0ec441e4eb22e711eabd843ba2` |
| Specular | https://edu.solarsystemscope.com/textures/download/2k_earth_specular_map.tif | TIFF, 2048×1024 | `6b90ecfce248591a1ecc9a3e49acca1a7059b6828877e718302ed9a6b4471bd7` |

### Modifications made for this site

- The 2K day, night, and cloud JPEGs retain the downloaded image bytes and were renamed for local use.
- The 2K normal TIFF was format-converted to JPEG with macOS `sips` at quality 84.
- The 2K specular TIFF was format-converted to JPEG with macOS `sips` at quality 80.
- The 1K variants were resized to 1024×512 and JPEG-compressed for mobile, reduced-memory, low-CPU, or data-saver clients.
- No SpaceX material, code, branding, or assets are included.

The page renders these textures with original site-authored materials, lighting, atmospheric rim, cloud layer, night-light blend, camera motion, and fallback behavior.

## Three.js

- Package: `three` 0.185.1
- Source package: https://registry.npmjs.org/three/-/three-0.185.1.tgz
- Registry integrity (SHA-512, base64): `5aojFCXKwnjBRZvUnt3WFfEcvUJgkN5LlijRFN95hMy8WVkG4I0QNcJE+OuWvuJ0bOdStrbfXn0pkd6/QyiAlg==`
- License: MIT
- Vendored files: `vendor/three.module.min.js` and its same-package dependency `vendor/three.core.min.js`
- License text: `vendor/THREE-LICENSE.txt`
