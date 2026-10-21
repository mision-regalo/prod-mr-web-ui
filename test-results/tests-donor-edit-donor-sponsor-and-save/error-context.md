# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/donor.spec.ts >> edit donor sponsor and save
- Location: tests/donor.spec.ts:3:1

# Error details

```
TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('button[aria-label="Edit donor"]') to be visible

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - button "Alternar menú lateral" [ref=e6]
      - img "Logo Misión regalo" [ref=e9]
      - generic [ref=e10]:
        - generic [ref=e11]: Misión regalo
        - generic [ref=e12]: Llevando alegría y regalos a niños de escuelas primarias para Navidad
    - generic [ref=e13]:
      - button "Acceder con Google" [ref=e14]
      - generic [ref=e21]:
        - generic [ref=e22]: "Simular Rol:"
        - combobox [ref=e23]:
          - option "Administrador General (Admin)" [selected]
          - option "Sofía Hernández (Leader)"
          - option "Carlos Mendoza (Coordinator)"
          - option "Alejandro Gómez Perez (Coordinator)"
          - option "Valeria Rios (Coordinator)"
          - option "Carlos Sanchez (Leader)"
          - option "Alex Sola (Coordinator)"
      - button "Cambiar a modo oscuro" [ref=e24]
      - button "ES" [ref=e27]
      - button "AG" [ref=e34] [cursor=pointer]
  - generic [ref=e35]:
    - complementary [ref=e37]:
      - generic [ref=e38]:
        - generic [ref=e39]: Usuario Autenticado
        - generic [ref=e40]:
          - generic [ref=e41]: A
          - generic [ref=e42]:
            - generic [ref=e43]: Administrador General
            - generic [ref=e44]: Admin
      - navigation [ref=e45]:
        - generic [ref=e46]: Menú por Permisos
        - button "Tablero General" [ref=e47]
        - button "Gestión de Cartas" [ref=e58]
        - button "Cierre de Captura" [ref=e67]
        - button "Días de Entrega (Eventos)" [ref=e76]
        - button "Líderes, Coordinadores y Padrinos" [active] [ref=e84]
        - button "Asignación Masiva" [ref=e94]
        - button "Simular Reasignación" [ref=e104]
        - button "Reasignación Manual" [ref=e113]
        - button "Reportes de Cobertura y Operación" [ref=e123]
        - button "Archivo de Cartas" [ref=e131]
        - button "Recordatorios (Email / WA)" [ref=e140]
        - button "Usuarios" [ref=e151]
    - main [ref=e162]:
      - generic [ref=e163]:
        - generic [ref=e164]:
          - generic [ref=e165]:
            - generic [ref=e166]:
              - heading "Voluntarios, Líderes y Donantes" [level=1] [ref=e167]
              - paragraph [ref=e168]: "Estructura organizativa: Líderes (150 cartas) ➔ Coordinadores (10-15 cartas) ➔ Donantes (Cartas individuales)."
            - button "Registrar Líder" [ref=e170]
          - generic [ref=e173]:
            - button "Líderes de Equipo (5)" [ref=e174]
            - button "Coordinadores (5)" [ref=e180]
            - button "Padrinos Donantes (10)" [ref=e187]
        - table [ref=e193]:
          - rowgroup [ref=e194]:
            - row [ref=e195]:
              - columnheader "ID / Equipo" [ref=e196]
              - columnheader "Nombre del Líder" [ref=e197]
              - columnheader "Color de Equipo" [ref=e198]
              - columnheader "WhatsApp" [ref=e199]
              - columnheader "Email" [ref=e200]
              - columnheader "Coordinadores Asignados" [ref=e201]
              - columnheader "Acciones" [ref=e202]
          - rowgroup [ref=e203]:
            - row [ref=e204]:
              - cell [ref=e205]:
                - button "LDR-01 (A)" [ref=e206] [cursor=pointer]
              - cell [ref=e211]:
                - button "Sofía Hernández" [ref=e212] [cursor=pointer]
              - cell "Azul Real" [ref=e213]
              - cell [ref=e216]:
                - link "+52 33 1234 5678" [ref=e217] [cursor=pointer]:
                  - /url: https://wa.me/523312345678
              - cell "sofia.hernandez@misionpresentes.org" [ref=e221]
              - cell "2" [ref=e222]
              - cell [ref=e223]:
                - generic [ref=e224]:
                  - generic [ref=e225]:
                    - button "Editar Líder" [ref=e226] [cursor=pointer]
                    - generic: Editar Líder
                  - generic [ref=e230]:
                    - button "Eliminar líder" [ref=e231] [cursor=pointer]
                    - generic: Eliminar Líder
            - row [ref=e235]:
              - cell [ref=e236]:
                - button "LDR-02 (B)" [ref=e237] [cursor=pointer]
              - cell [ref=e242]:
                - button "Carlos Mendoza" [ref=e243] [cursor=pointer]
              - cell "Rojo Pasión" [ref=e244]
              - cell [ref=e247]:
                - link "+52 33 9876 5432" [ref=e248] [cursor=pointer]:
                  - /url: https://wa.me/523398765432
              - cell "carlos.mendoza@misionpresentes.org" [ref=e252]
              - cell "2" [ref=e253]
              - cell [ref=e254]:
                - generic [ref=e255]:
                  - generic [ref=e256]:
                    - button "Editar Líder" [ref=e257] [cursor=pointer]
                    - generic: Editar Líder
                  - generic [ref=e261]:
                    - button "Eliminar líder" [ref=e262] [cursor=pointer]
                    - generic: Eliminar Líder
            - row [ref=e266]:
              - cell [ref=e267]:
                - button "LDR-03 (C)" [ref=e268] [cursor=pointer]
              - cell [ref=e273]:
                - button "Mariana Vázquez" [ref=e274] [cursor=pointer]
              - cell "Verde Esperanza" [ref=e275]
              - cell [ref=e278]:
                - link "+52 33 5544 3322" [ref=e279] [cursor=pointer]:
                  - /url: https://wa.me/523355443322
              - cell "mariana.vazquez@misionpresentes.org" [ref=e283]
              - cell "0" [ref=e284]
              - cell [ref=e285]:
                - generic [ref=e286]:
                  - generic [ref=e287]:
                    - button "Editar Líder" [ref=e288] [cursor=pointer]
                    - generic: Editar Líder
                  - generic [ref=e292]:
                    - button "Eliminar líder" [ref=e293] [cursor=pointer]
                    - generic: Eliminar Líder
            - row [ref=e297]:
              - cell [ref=e298]:
                - button "LDR-04 (D)" [ref=e299] [cursor=pointer]
              - cell [ref=e304]:
                - button "Sara Sanchez" [ref=e305] [cursor=pointer]
              - cell "Verde" [ref=e306]
              - cell [ref=e309]:
                - link "+523342561845" [ref=e310] [cursor=pointer]:
                  - /url: https://wa.me/523342561845
              - cell "giovanna.sptfy@gmail.com" [ref=e314]
              - cell "0" [ref=e315]
              - cell [ref=e316]:
                - generic [ref=e317]:
                  - generic [ref=e318]:
                    - button "Editar Líder" [ref=e319] [cursor=pointer]
                    - generic: Editar Líder
                  - generic [ref=e323]:
                    - button "Eliminar líder" [ref=e324] [cursor=pointer]
                    - generic: Eliminar Líder
            - row [ref=e328]:
              - cell [ref=e329]:
                - button "LDR-05 (E)" [ref=e330] [cursor=pointer]
              - cell [ref=e335]:
                - button "Carlos Sanchez" [ref=e336] [cursor=pointer]
              - cell "Negor" [ref=e337]
              - cell [ref=e340]:
                - link "+523310219320" [ref=e341] [cursor=pointer]:
                  - /url: https://wa.me/523310219320
              - cell "carlos.a.sanchez.s@gmail.com" [ref=e345]
              - cell "1" [ref=e346]
              - cell [ref=e347]:
                - generic [ref=e348]:
                  - generic [ref=e349]:
                    - button "Editar Líder" [ref=e350] [cursor=pointer]
                    - generic: Editar Líder
                  - generic [ref=e354]:
                    - button "Eliminar líder" [ref=e355] [cursor=pointer]
                    - generic: Eliminar Líder
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('edit donor sponsor and save', async ({ page }) => {
  4  |   // Navigate to the app (using the dev server URL for the test environment)
  5  |   await page.goto('http://localhost:3000'); 
  6  | 
  7  |   // Navigate to Volunteers view
  8  |   // Wait for the drawer and the specific button to be present
  9  |   await page.waitForSelector('[data-testid="nav-volunteers"]', { timeout: 15000 });
  10 |   await page.click('[data-testid="nav-volunteers"]'); 
  11 | 
  12 |   // Click the edit button for the first donor
  13 |   // Correct aria-label matches the code
> 14 |   await page.waitForSelector('button[aria-label="Edit donor"]', { timeout: 15000 });
     |              ^ TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
  15 |   await page.click('button[aria-label="Edit donor"] >> nth=0');
  16 | 
  17 |   // Verify modal is open
  18 |   await page.waitForSelector('text=Editar Padrino Donante', { timeout: 10000 });
  19 |   await expect(page.locator('text=Editar Padrino Donante')).toBeVisible();
  20 | 
  21 |   // Save changes
  22 |   await page.click('text=Guardar Cambios');
  23 | 
  24 |   // Verify modal is closed
  25 |   await expect(page.locator('text=Editar Padrino Donante')).not.toBeVisible();
  26 | });
  27 | 
```