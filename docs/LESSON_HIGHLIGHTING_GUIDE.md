# Ghid pentru Evidențierea Conținutului în Lecții

## Tag-uri Disponibile

Sistemul de evidențiere suportă următoarele tag-uri speciale:

### 1. `[FORMULA]...[/FORMULA]`
- **Culoare**: Galben/portocaliu
- **Iconiță**: 📐
- **Utilizare**: Pentru formule matematice importante
- **Exemplu**: `[FORMULA]F = ma[/FORMULA]`

### 2. `[ENUNT]...[/ENUNT]`
- **Culoare**: Albastru
- **Iconiță**: 📋
- **Utilizare**: Pentru enunțuri de probleme sau teoreme
- **Exemplu**: `[ENUNT]Legea a doua a lui Newton spune că...[/ENUNT]`

### 3. `[IMPORTANT]...[/IMPORTANT]`
- **Culoare**: Roșu
- **Iconiță**: ⚠️
- **Utilizare**: Pentru informații importante de reținut
- **Exemplu**: `[IMPORTANT]Această formulă este fundamentală![/IMPORTANT]`

### 4. `[DEFINITIE]...[/DEFINITIE]`
- **Culoare**: Verde
- **Iconiță**: 📖
- **Utilizare**: Pentru definiții de concepte
- **Exemplu**: `[DEFINITIE]Forța este o mărime vectorială...[/DEFINITIE]`

### 5. `[EXEMPLU]...[/EXEMPLU]`
- **Culoare**: Violet
- **Iconiță**: 💡
- **Utilizare**: Pentru exemple practice
- **Exemplu**: `[EXEMPLU]Dacă o mașină de 1000kg...[/EXEMPLU]`

## Exemplu de Conținut

```
# Legea a doua a lui Newton

[DEFINITIE]Legea a doua a lui Newton este una dintre legile fundamentale ale mecanicii clasice.[/DEFINITIE]

[FORMULA]F = ma[/FORMULA]

[FORMULA]$$\vec{a} = \frac{d\vec{v}}{dt}$$[/FORMULA]

[ENUNT]Această lege spune că forța aplicată unui obiect este egală cu produsul dintre masa obiectului și accelerația acestuia.[/ENUNT]

[IMPORTANT]Această formulă este valabilă doar în sisteme de referință inerțiale![/IMPORTANT]

[EXEMPLU]Dacă aplicăm o forță de 100N unei mașini de 1000kg, accelerația va fi de 0.1 m/s².[/EXEMPLU]
```

## Suport pentru LaTeX

Tag-urile de evidențiere funcționează perfect cu ecuații LaTeX:

```
[FORMULA]$$\vec{F} = m\vec{a}$$[/FORMULA]
[FORMULA]$$E = mc^2$$[/FORMULA]
[FORMULA]$$\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$[/FORMULA]
```

Ecuațiile LaTeX vor fi afișate cu stilul de evidențiere corespunzător (galben pentru FORMULA, albastru pentru ENUNT, etc.).

## Caracteristici

- **Design responsiv**: Se adaptează automat la dispozitivele mobile
- **Iconițe intuitive**: Fiecare tip de conținut are o iconiță distinctă
- **Gradiente moderne**: Fundaluri cu gradiente pentru un aspect profesional
- **Umbre subtile**: Efecte de umbră pentru profunzime vizuală
- **Compatibilitate**: Funcționează cu sistemul existent de LaTeX și Markdown

## Implementare

Sistemul este implementat în:
- `components/lesson-viewer.tsx` - procesarea tag-urilor
- `app/globals.css` - stilurile CSS pentru evidențiere

Nu necesită modificări în baza de date Supabase.
