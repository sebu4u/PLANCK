# 📝 PlanckCode IDE - Ghid de Utilizare Multi-File

## ✅ Funcționalități Implementate

### 1. **Citire din fișiere .txt**
Poți crea fișiere `.txt` în IDE și să citești din ele cu `ifstream`.

**Exemplu:**

**Fișier: input.txt**
```
42
Andrei
```

**Fișier: main.cpp**
```cpp
#include <iostream>
#include <fstream>
using namespace std;

int main() {
    ifstream fin("input.txt");
    int numar;
    string nume;
    
    fin >> numar >> nume;
    fin.close();
    
    cout << "Am citit: " << numar << " si " << nume << endl;
    return 0;
}
```

**Output așteptat:**
```
Am citit: 42 si Andrei
```

---

### 2. **Scriere în fișiere și afișare automată**
Când folosești `ofstream` pentru a scrie într-un fișier, conținutul este afișat automat la final!

**Exemplu:**

**Fișier: main.cpp**
```cpp
#include <iostream>
#include <fstream>
using namespace std;

ofstream g("output.txt");

int main() {
    cout << "Processing..." << endl;
    
    g << "Hello World!" << endl;
    g << "This is line 2" << endl;
    g << "Result: " << 42 * 2 << endl;
    g.close();
    
    cout << "Done!" << endl;
    return 0;
}
```

**Output așteptat:**
```
Processing...
Done!

=== Content of output.txt ===
Hello World!
This is line 2
Result: 84
```

---

### 3. **Combinare: Citire + Scriere + Afișare normală**

**Fișier: data.txt**
```
10
20
```

**Fișier: main.cpp**
```cpp
#include <iostream>
#include <fstream>
using namespace std;

ofstream fout("results.txt");

int main() {
    cout << "=== Program Start ===" << endl;
    
    // Citește din fișier
    ifstream fin("data.txt");
    int a, b;
    fin >> a >> b;
    fin.close();
    
    cout << "Read numbers: " << a << " and " << b << endl;
    
    // Calculează și scrie în fișier
    int sum = a + b;
    int product = a * b;
    
    fout << "Sum: " << sum << endl;
    fout << "Product: " << product << endl;
    fout.close();
    
    cout << "Results written to file!" << endl;
    cout << "=== Program End ===" << endl;
    
    return 0;
}
```

**Output așteptat:**
```
=== Program Start ===
Read numbers: 10 and 20
Results written to file!
=== Program End ===

=== Content of results.txt ===
Sum: 30
Product: 200
```

---

## 🎯 Cum funcționează în spate:

1. **Pentru citire:** Toate fișierele `.txt` și `.cpp` pe care le creezi sunt trimise la Judge0 ca `additional_files`
2. **Pentru scriere:** Backend-ul detectează automat declarațiile `ofstream` și injectează cod care:
   - Adaugă `#include <fstream>` dacă lipsește
   - La sfârșitul funcției `main()`, citește fișierul creat
   - Afișează conținutul la `stdout`

## 💡 Sfaturi:

- Fișierele `.txt` goale sunt OK - le poți folosi ca placeholder pentru fișiere de output
- Poți avea mai multe fișiere de output - toate vor fi afișate automat
- `cout` normal funcționează exact ca înainte
- Poți combina citire din mai multe fișiere și scriere în mai multe fișiere

## 🐛 Debugging:

Dacă întâmpini probleme:
1. Verifică consola serverului pentru log-uri detaliate
2. Asigură-te că numele fișierelor corespund exact
3. Nu uita să închizi fișierele cu `.close()`

