# Teste de round-trip da âncora persistente (Dispatch #1)

> Este é o PRIMEIRO teste obrigatório do projeto. Se ele falhar, registre
> o erro exato e pare — não avance para o Loop v1 (Dispatch #2).

## O que o teste prova

Que a âncora persistente sobrevive de uma sessão para outra: os 3 painéis
reaparecem no mesmo XYZ sem re-ler nenhum AprilTag.

## Como funciona (o que o código faz)

1. Na primeira sessão XR, o `SceneUnderstandingSystem` do SDK cria UMA
   âncora nativa na origem do espaço de referência, pede um handle
   persistente e guarda o UUID no `localStorage` sob a chave do SDK
   (`iwsdk_scene_anchor_uuid`).
2. Cada painel de dispositivo vinculado recebe o componente `XRAnchor` e
   fica preso ao grupo ancorado estável.
3. Na segunda sessão, o SDK restaura o UUID e o grupo ancorado volta ao
   mesmo lugar físico — os painéis reaparecem no mesmo XYZ.
4. O `AuraAnchorSystem` registra os eventos em `localStorage`
   (`aura_anchor_test_log`) e mostra o status na linha da âncora de cada
   painel.

## Procedimento

### Sessão 1 — vincular (no emulador, perfil Quest 3)

1. `npm run dev` e entre na sessão XR no emulador (perfil Quest 3).
2. Aponte para o sticker da **lâmpada** e faça pinch em **"Ler tag"**.
   O painel da lâmpada aparece abaixo do sticker.
3. Repita para o **ar-condicionado** (id 1) e a **fechadura** (id 2).
4. Em cada painel, confira a linha da âncora: deve dizer **"Âncora: ativa"**.
5. Saia da sessão XR e feche o app (ou só saia da sessão).

### Sessão 2 — restaurar (sem re-ler nada)

6. Abra o app de novo e entre na sessão XR, no mesmo lugar físico
   (emulador: mesma cena; Quest 3S: o mesmo cômodo).
7. **Não toque em nenhum sticker.** Os 3 painéis devem já estar visíveis,
   no mesmo lugar da sessão 1.
8. Em cada painel, confira a linha da âncora: deve dizer
   **"Âncora: ativa (restaurada)"**.
9. Teste os controles: pinch em "Ligar" (lâmpada e ar-condicionado),
   "+" / "-" da temperatura e do brilho, "Destrancar" na fechadura.
   Saia e entre de novo: os valores devem estar como você deixou
   (ligado/desligado, temperatura, brilho e tranca persistem).

## Checklist de aceite

- [ ] Sessão 1: os 3 painéis aparecem depois de "Ler tag".
- [ ] Sessão 1: linha da âncora diz "ativa" nos 3 painéis.
- [ ] Sessão 2: os 3 painéis já estão lá, sem tocar nos stickers.
- [ ] Sessão 2: linha da âncora diz "ativa (restaurada)" nos 3 painéis.
- [ ] Pinch liga/desliga a lâmpada e o ar-condicionado.
- [ ] Pinch tranca/destranca a fechadura.
- [ ] Temperatura (16–30 °C, passo 1) e brilho (0–100%, passo 5) persistem
      entre sessões.
- [ ] O botão "Ver câmera" abre o placeholder; "Fechar câmera" fecha.

## Se falhar

- **A linha da âncora fica em "aguardando sessão XR…"**: a sessão XR não
  subiu ou o recurso `anchors` não foi concedido. Confira o console do
  navegador e `iwsdk.config.json` (`world.xr.features.anchors: true`).
- **O painel não reaparece na sessão 2**: confira no DevTools →
  Application → Local Storage as chaves `iwsdk_scene_anchor_uuid`
  (UUID do SDK), `aura_bound_devices_v1` (os 3 ids) e
  `aura_anchor_test_log` (os eventos registrados). Copie o log e o erro
  exato do console — é o que o Dispatch #1 pede para registrar.
- **O emulador não oferece `anchors`**: o teste passa para o Quest 3S
  físico (o emulador simula o dispositivo, mas nem todo recurso WebXR
  está disponível nele). O teste no Quest 3S é o segundo passo da ordem
  de testes do projeto, de qualquer forma.
