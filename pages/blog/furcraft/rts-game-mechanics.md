# Grundlegende Mechaniken in einem RTS
Erstellt am 6. April 2022

Was nötige Komponenten für ein RTS:

## Pathfinding

Was pathfinding
Einheiten sollen in der Lage sein, durch ein KomplexesGelände navigieren zu können
Dies wird inRTS spielen üblicherweise durch ein NavMesh umgesetzt
Dabei wird anhand der Geometrie in Graph erzeugt,der die Fläche repräsentiert Komma auf der sich Einheiten bewegen können
Üblicherweise wirdzum Park finding in diesem Graphenein a Stern Algorithmus verwendet
Diese Wegberechnung muss vor allem schnell und zuverlässig funktionieren.
Normalerweise spricht man hier jeweils von der globalen und einer lokalen Navigation
Die globale Navigationbeschreibt den Weg Komma den eine Einheit von einem Anfangspunkt zu einem Endpunkt im nach Maß zurücklegen muss
Die lokale Navigation beschreibt Komma das EinheitenverbündetenEinheiten ausweichen sollenKomma um Kollisionen zu vermeiden
Das nach Maß selbst verändert sich im Laufe eines Spiels.
Wenn Gebäude platziert werden,dann können Einheiten in einem gewissen Bereich nicht mehr Durchgehen.
Was wenn sich das nach MEC ändert Komma dann mussder Graf in einem örtlich begrenzten Bereich neu aufgebaut werden.
Daein Spiel in Echtzeit abläuft, Muss die gesamte Berechnung in einem Sechzigstel Nr Sek abgeschlossen spielen
Daher muss das nach Match selbst in Jungs aufgeteilt werden, damit bei einer Änderung nur ein bestimmter Teil des Nachmassneu berechnet werden Muss.

Was verschiedene Arten an nach Smith
Die Polygone Komma die in einem nach MEC generiert werden, können verschiedene Eigenschaften haben.
In einem RTS Spiel kann es sein Komma dass es Einheiten gibtKomma die sich nur auf unterschiedlichen Oberflächen fortbewegen können.
Wenn eine Infanterieeinheit auf einem Weg läuft Komma und dann zu einemzu einer Furt kommt,dann kann sie nicht passieren.
Wenn die Einheit das zusätzliche Attribut hatHallo Anführungszeichenamphibisch,dann kann sie sich durch diese Furt durch bewegenohne Probleme.
Verschiedene Landtypen wären zum Beispiel:Land, seichtes Wasser, tiefes Wasser, Lava, Klippen, Untergrund, Gebäude, Wegblocker.

Shortcuts in NAV Misch
Ein nach Meschede kann auch besondere Edge enthaltenKomma die weit entfernte Polygone miteinander verbinden.
Theoretisch kann der Spieler einen Teleporter bauenKomma den die Einheiten dann in ihreWegberechnung entsprechendberücksichtigen können.
Die Kante Komma die den Eintrittspunkt und den Austrittspunktdes Teleporters repräsentiertKamera kann dabei unendlich schmal sein
In dem Fall ist es nicht wichtig Komma wie breit die Einheit ist.Es ist nur wichtig Komma dass Sie den Titel Porter Eingang berühren kann

Gerichtete Flächen
Edges in einem navigations Graphen können theoretisch gerichtet seien
Das heißt Komma wenn eine Einheit den Bereich betritt Komma dann kann sie sich nur in eine Richtung weiter bewegenohne
Ein Beispiel wäre komme dass sich eine Einheiteine Rampehinunterrutschen kannkomme aber nicht mehr hinauf
Die Frage ist Komma wie sich diese Richtung in dem Navigationsgrafen dann darstellen lässt
Normalerweise wird in den navigations Graphen alles durch die Verbindung zwischen Polygonen(Kanten genannt)gelöst
Dies würde in dem Fall bedeuten Komma dass sichein Zielpfaddurch die Fläche in eine bestimmte Richtung bewegen muss
Ich weiß nicht Komma ob das in dem Fall so einfach umzusetzen ist

Größe von Einheiten im NavMesh
Einheiten Komma die das nass mich verwendenkomme können unterschiedliche Durchmesser haben.
Eine Panzereinheit ist zum Beispiel breit als eine Infanterieeinheit
Es gibt anscheinend verschiedene Methoden Komma mitder Manndiese Größen berücksichtigen könnte
Die naive Methode ist es,einen Algorithmus laufen zu lassen der nach festgelegten Kleidergrößen Dasnuf mich berechnet
Das kann zu Problemen führen Komma da dann verschiedeneNashverschiedene Aufgabenhandhaben müssen

Zielort von mehreren Einheiten
In starcraft 2kann man eine beliebige Anzahl an Einheiten gleichzeitig bewegen
Je nachdem wie groß die Gruppe ist,verhält sich das Einhalten bewegen anders
Wenn man Einheiten in einem kleinem Radius auswählt und nach vorne schicktKomma dann halten sie ihre Formation ein.
Wenn man Einheiten aus einem großen Radius wähltKomma dannsammeln sich die Einheiten alle in einem Grüppchen am Zielort.

Bewegung von mehreren Einheiten:
In Starcraft 2 haben die Einheiten auch die Eigenschaft,das ist sie bei euch Engstellen nicht drinnen oder außen rumlaufen
Stattdessen versuchen alle Einheiten der Reihe nach durch die Engstelle Durchzutreten

Wegschieben von befreundeten Einheiten
Alle Einheiten kann man die als befreundet oder neutral Celle, können vonanderen Einheiten weggeschoben werden.
Dies ist wichtig Komma wenn sich zum Beispiel eine Gruppe an Einheiten vor dem Lagerausgang versammelt hat,damit die sich bewegende Einheit den auch das Lager verlassen kannkomme.
Dies funktioniert aber nur bei befreundeten Einheiten.Einheiten des Gegners können nicht verschoben werden.

Datenstruktur
Ein Navigationsgraf wird normalerweise durch einengraphen repräsentiert
gerichte sein komma muss aber immer ah zyklisch sein

Ziel oder nicht erreichbar
Wenn eine Einheit einen Weg zu einem Ziel planen soll Komma aber dieseweg nicht frei ist komme dann soll die Einheitso nahe wie möglich an den Zielort herangehen
Was die Frage ist Komma wie man so einen Algorithmus effizient umsetzen kann
Am besten wäre es Komma und kann auf mathematisch Weise einfach bestimmen, ob eine Einheit einen Zielort erreichen kann
Wenn sie den Zielort erreichen kann Komma dann wird derbereits berechnet der Pfad verwendet
Wenn die Einheit den Zielort nicht erreichen kann Komma dann wird in einem Näherungsverfahrendir nächste. Genommen

Umplanung des Weges
Wenn sich eine Einheitauf dem Weg zu einem Zielort machtKomma wird in der Zwischenzeit die Zielort versperrt wird,dann soll die Einheit selbständig einen neuen Weg berechnen
In dem Fall solldas navigations Mischwissen, welche Routen aktuellim nach Misch geplant sind
Wenn der graf nun an einer bestimmten stelle aktualisiert wird und an dieser stelle Ein ein Heidenpfad verläuft Komma dann solldieser Pfadgelöscht werden und die Einheit einen neuen Pfad berechnen

Der Weg ist durch mehrere Einheiten versperrt
In Starcraft 2 kann man Einheitenauf Position halten setzen.
Das heißt, diese Einheiten bewegen sich nicht weg Komma auch wenn sie angegriffen werden oder von einer befreundeten Einheit angestupst
Das Verhalten in Starcraft 2 ist dann Komma dass ich die Einheitendann langsam ruckelnd nach vorne bewegen Und sehr langsam die Einheit aus dem Weg schieben Komma die den Weg versperrt.

