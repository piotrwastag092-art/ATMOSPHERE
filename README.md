# ATMOSPHERE — Earth Control System

Pierwsza wersja aplikacji ATMOSPHERE: interaktywny, lokalny symulator atmosfery i pogody na wirtualnej planecie.

## Uruchomienie lokalne

Aplikacja korzysta z modułów ES i import map, dlatego uruchamiaj ją przez lokalny serwer HTTP, a nie przez `file://`.

Przykład z Pythonem:

```bash
python -m http.server 8000
