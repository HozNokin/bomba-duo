# 💣 Desarme a Bomba Duo

Jogo cooperativo para **2 pessoas**, jogado no **navegador do celular** — sem instalar nada, sem login, sem servidor obrigatório.

Um jogador é o **🧨 Agente em Campo** (vê a bomba) e o outro é o **📖 Especialista** (vê o manual). Eles **não veem a tela um do outro**: precisam conversar por voz, descrever o que veem e desarmar todos os módulos antes do timer zerar. Errou 3 vezes... 💥 BOOM!

🎮 **Jogue agora:** https://hoznokin.github.io/bomba-duo/

---

## 📱 Como jogar (2 iPhones ou Android)

1. Os dois abrem o **mesmo link** no navegador do celular
2. Digitam o **MESMO código de sala** (só letras, até 7 — ex: `AMOR`)
3. Escolhem o modo no switch: **😌 Fácil** ou **🔥 Difícil**
4. Um escolhe **🧨 Agente**, o outro **📖 Especialista**
5. Ligam o áudio (ou ficam lado a lado) e começam juntos!

> 💡 Dica: no Safari, toque em **Compartilhar → Adicionar à Tela de Início** para jogar em tela cheia, sem barra de endereço.

---

## 🎚️ Modos de jogo

| | 😌 Fácil | 🔥 Difícil |
|---|---|---|
| Tempo | 3:00 | 5:00 |
| Módulos | 4 | 7 (4 base + 3 mão dupla) |
| Código | normal (`AMOR`) | terminado em **X** (`AMORX`) |

**O modo viaja no código da sala:** ligar o switch Difícil anexa um `X` ao código automaticamente. Como a bomba inteira é gerada a partir do código, **código igual = mesma bomba + mesmo modo**, sem risco de um estar no Fácil e o outro no Difícil. Confira pelo banner no topo das duas telas (`😌 FÁCIL` / `🔥 DIFÍCIL`).

---

## 🧩 Os 7 módulos

### Base (Fácil + Difícil)

| # | Módulo | Agente vê | Especialista faz |
|---|---|---|---|
| 1️⃣ | **Fios** | 4 fios coloridos | Consulta a tabela (vermelho? série par/ímpar? último amarelo? 1 azul?) e diz qual cortar |
| 2️⃣ | **Botão** | Botão colorido com palavra | Diz se é **toque rápido** ou **segurar e soltar** quando o timer mostrar certo número |
| 3️⃣ | **Símbolos** | 4 símbolos embaralhados | Acha a coluna na tabela e dita a ordem de toque |
| 4️⃣ | **Labirinto Cego** 🌀 | Grade 5×5 com 🤖 e 🏁, **sem paredes** | Tem o mapa com as paredes e guia passo a passo por voz. A cada 2 esbarrões = 1 erro |

### Mão dupla (só no Difícil — o Especialista também sua!)

| # | Módulo | Dinâmica |
|---|---|---|
| 5️⃣ | **Cofre** 🔢 | O manual tem a fórmula, mas faltam 2 dados que só o Agente vê (nº de vermelhos **originais** + posição do 1º amarelo). Especialista interroga, Agente digita nos steppers |
| 6️⃣ | **Farol** 💡 | O farol pisca uma cor; o Agente anuncia, o Especialista consulta o mapa flash→toque e manda tocar. 3 rodadas |
| 7️⃣ | **Senha** 🔤 | O Agente tem 3 rodinhas de letras (sem saber as palavras); o Especialista tem a lista (`SOL, MAR, LUA, MEL, PAZ...`) e elimina candidatas até achar a única formável |

### 📋 Ficha da Bomba
Resumo fixo sempre visível (cores dos fios + botão), para consultar mesmo depois que os módulos recolhem.

### Regras gerais
- ❤️ 3 vidas compartilhadas — zerou = 💥
- ✅ Módulo resolvido encolhe sozinho (com 450ms de delay anti clique-fantasma no iOS)
- ⏱️ Timer e nº de série ficam fixos no topo (sticky)

---

## 🏠 Rodando em casa (servidor local)

Para jogar na rede Wi-Fi de casa **com painel de dispositivos**:

```bash
cd bomba-duo
node server.js
# ou no Windows: dois cliques em rodar-servidor.bat
```

Nos celulares (mesmo Wi-Fi): `http://SEU-IP:3000` (o terminal mostra o endereço).

📡 **Painel de dispositivos:** `http://SEU-IP:3000/painel` — mostra todo aparelho que conectar (iPhone/Android/PC), IP e hora de entrada. Útil para confirmar que os dois entraram.

---

## 🛠️ Como funciona (técnico)

- **Arquivo único:** o jogo todo está em `index.html` (HTML + CSS + JS inline) — zero build, zero dependência
- **Multiplayer sem servidor:** a bomba é gerada de forma **determinística a partir do código da sala** (hash FNV-1a + PRNG Mulberry32). Mesmo código = mesma bomba nos dois aparelhos; a sincronização é feita por voz
- **Validação local:** todas as regras são verificadas no aparelho do Agente
- **Mobile-first:** controles touch grandes, `viewport-fit=cover` (notch/Dynamic Island), vibração e sons via WebAudio, `prefers-reduced-motion` respeitado
- **Tema:** glass claro marrom (`#8B5E3C`), confortável para os olhos

### Estrutura

```
bomba-duo/
├── index.html          # o jogo (tudo aqui)
├── server.js           # servidor local: arquivos + /painel + /dispositivos
├── package.json        # npm start
└── rodar-servidor.bat  # dois cliques no Windows
```

### Lógica dos módulos (resumo da geração)

- **Fios:** 4 cores aleatórias; fio correto por árvore de decisão (manual)
- **Botão:** cor + texto aleatórios; regra por prioridade (DETONA+vermelho → 1, amarelo → 5, ABORTA → toque, senão → 2)
- **Símbolos:** 1 de 4 colunas, ordem embaralhada na tela
- **Labirinto:** 5×5 com 6 paredes, com verificação de caminho (BFS) — sempre solucionável
- **Cofre:** `vermelhos + posição do 1º amarelo (0 se não há)`
- **Farol:** 3 flashes; mapa `vermelho→azul, azul→amarelo, amarelo→branco, branco→vermelho`
- **Senha:** 1 de 12 palavras; rodinhas com a letra certa + 5 distratores, com loop que garante **unicidade** (só a palavra-alvo é formável)

---

## 🗺️ Ideias futuras

- [ ] Placar melhor-de-3 entre o casal
- [ ] Modo Memórias (perguntas sobre o casal para desbloquear módulos)
- [ ] Mais palavras na Senha / mais colunas de Símbolos
- [ ] Modo escuro automático
- [ ] Tradução EN/ES

---

Feito com 💛 para jogar a dois. Errou 3x? O amor sobrevive à explosão. 💥
