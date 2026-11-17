/**
 * A.U.R.A. v1 — Interface de provedor de IA (stub para o porte futuro).
 *
 * NENHUM sistema do v1 chama decide(). A interface existe para que o
 * porte para o Meta Llama (depois do v1) seja uma troca de provedor, não
 * uma reescrita — conforme o plano do projeto. A base de decisão do v1
 * são as regras locais determinísticas (src/core/rules.ts).
 */

export interface AIProvider {
  readonly name: string;
  decide(input: string): Promise<string>;
}

/** Provedor local: resposta determinística, sem rede, sem inferência. */
export class LocalRulesProvider implements AIProvider {
  readonly name = 'local-rules';

  async decide(input: string): Promise<string> {
    return JSON.stringify({
      provider: 'local-rules',
      decision: 'rules-only',
      input,
    });
  }
}

/** Provedor não configurado: falha explícita em vez de silêncio. */
export class NotConfiguredProvider implements AIProvider {
  constructor(readonly name: string) {}

  async decide(): Promise<string> {
    throw new Error(
      `Provedor de IA "${this.name}" não configurado no v1 — nenhuma chamada de IA é feita.`,
    );
  }
}

export type ProviderKind = 'local-rules' | 'jev' | 'laya';

/**
 * Fábrica de provedores. 'jev' (TypeSafe Jev, escolha primária) e 'laya'
 * (fallback local, pesos abertos) voltam como provedores reais depois do
 * v1; por enquanto são stubs que falham explicitamente.
 */
export function createProvider(kind: ProviderKind): AIProvider {
  switch (kind) {
    case 'local-rules':
      return new LocalRulesProvider();
    case 'jev':
      return new NotConfiguredProvider('jev');
    case 'laya':
      return new NotConfiguredProvider('laya');
  }
}
