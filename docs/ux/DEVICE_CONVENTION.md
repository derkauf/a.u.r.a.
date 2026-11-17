# Convenção de estados dos dispositivos (cor + ícone)

Definida pelo usuário em 17/11/2026. Diz que cor e que ícone cada tipo de dispositivo mostra em cada estado, para que o mesmo estado tenha a mesma cara em todo o ecossistema (app, landing page, vídeo).

- **Fonte única no código:** [`src/devices/device-convention.ts`](../../src/devices/device-convention.ts) (`DEVICE_CONVENTION`, `CONVENTION_COLORS`). As janelas dos dispositivos leem essa tabela.
- **Acompanhamento (o que já está no app e o que falta):** planilha [A.U.R.A. Device Convention](https://claude.ai/artifact/GW6KU3KYj1PZGH8RzKs9Hh), com colunas de ícone (emoji para ver na planilha + nome do ícone Lucide usado no app), cor (célula pintada) e status (Aplicado no app / Falta fazer / Proposta).
- Ícones: biblioteca Lucide (`@pmndrs/uikit-lucide`). Não há ícone de painel solar nem de campainha: `Sun` e `BellRing` propostos.

## A convenção, como o usuário definiu

| Dispositivo | Estado | Cor | Ícone |
|---|---|---|---|
| Door / Gate / Garage | Locked | Vermelho `#ff5a5f` | cadeado fechado (`Lock`) |
| Door / Gate / Garage | Unlocked | Verde `#3ddc84` | cadeado aberto (`LockOpen`) |
| HVAC › AC | — | Azul `#4aa8ff` | neve (`Snowflake`) |
| HVAC › HV (aquecimento) | — | Laranja `#ff9f43` | fogo (`Flame`) |
| HVAC › Fan | — | Branco | brisa (`Wind`) |
| Floor heating | On / Off | Laranja / Azul | `Heater` |
| Solar panels | On (input) / Off | a definir | a definir (`Sun` / `SunDim` propostos) |
| Blinds & curtains | 0% a 100% fechada | do branco (0%) ao preto (100%) | eclipse (`Eclipse`) |
| Sense control › Smart diffusers | On / Off | a definir | a definir (`SprayCan` proposto) |
| Oven | On / Off | Vermelho / Branco | fogo (`Flame`) / seguro (`ShieldCheck`) |
| Speakers | On / Off | Branco / Off-white | som (`Volume2`) / sem som (`VolumeX`) |
| Security & surveillance › Security cameras | campainha, garagem etc., percorrendo todas as câmeras da casa | a definir | a definir (`Cctv`, `BellRing` propostos) |

## Aplicado no app (17/11)

Cada janela de dispositivo mostra o ícone de estado ao lado do status, e o ícone e o texto do status ficam na cor da convenção:

- **Fechadura (door):** trancada = cadeado fechado vermelho; destrancada = cadeado aberto verde.
- **Ar-condicionado (HVAC › AC):** floco de neve azul; desligado em cinza (proposta).
- **Lâmpada e TV:** fora da lista do usuário; propostas: lâmpada âmbar / apagada cinza; TV branca / off-white (mesma regra de Speakers).

Os outros dispositivos da lista ainda não existem no app (status "Falta fazer" na planilha).
