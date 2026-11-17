/**
 * A.U.R.A. v1 — Cursor de raio da mão com snap magnético (Dispatch #2).
 *
 * Um anel + ponto central que acompanha a mão:
 * - repouso: fica na ponta do dedo indicador direito (indexTipSpaces);
 * - sobre um controle (painel, sticker ou botão com RayInteractable): o
 *   cursor "gruda" (snap magnético) no centro do alvo, cresce e fica
 *   âmbar — o feedback visual de que o pinch vai acertar ali.
 *
 * O alvo vem da query de Hovered (o SDK marca a entidade sob o raio);
 * a posição do alvo vem do nó de cena (LevelTag id → getSceneObject).
 * Sem alocação por frame: todos os vetores são pré-alocados no init().
 * O cursor só aparece com sessão XR ativa (no navegador 2D, sem mão,
 * ele fica escondido).
 */
import {
  createSystem,
  DoubleSide,
  Group,
  Hovered,
  LevelTag,
  Mesh,
  MeshBasicMaterial,
  RayInteractable,
  RingGeometry,
  SphereGeometry,
  Vector3,
  type Entity,
} from '@iwsdk/core';

const CURSOR_REST_COLOR = 0xffffff;
const CURSOR_SNAP_COLOR = 0xffc107; // âmbar
const SNAP_OFFSET_M = 0.01; // 1 cm em direção ao usuário (evita z-fighting)

export class AuraCursorSystem extends createSystem({
  hovered: { required: [RayInteractable, Hovered] },
}) {
  private cursorGroup: Group | null = null;
  private ringMaterial: MeshBasicMaterial | null = null;
  private snapTarget: Entity | null = null;

  // Pré-alocados no init() — nunca alocar no update().
  private tmpPos: Vector3 = new Vector3();
  private tmpHead: Vector3 = new Vector3();
  private tmpDir: Vector3 = new Vector3();

  init(): void {
    const ring = new Mesh(
      new RingGeometry(0.018, 0.024, 32),
      new MeshBasicMaterial({
        color: CURSOR_REST_COLOR,
        transparent: true,
        opacity: 0.95,
        side: DoubleSide,
      }),
    );
    this.ringMaterial = ring.material as MeshBasicMaterial;
    const dot = new Mesh(
      new SphereGeometry(0.006, 16, 12),
      new MeshBasicMaterial({ color: CURSOR_REST_COLOR }),
    );
    const group = new Group();
    group.add(ring);
    group.add(dot);
    group.visible = false;
    this.cursorGroup = group;
    this.world.createTransformEntity(group);

    this.cleanupFuncs.push(
      this.queries.hovered.subscribe('qualify', (entity) => {
        this.snapTarget = entity;
      }),
    );
    this.cleanupFuncs.push(
      this.queries.hovered.subscribe('disqualify', (entity) => {
        if (this.snapTarget === entity) this.snapTarget = null;
      }),
    );
  }

  update(): void {
    const cursor = this.cursorGroup;
    if (!cursor) return;
    // Sem sessão XR não há raio de mão — cursor escondido.
    if (this.world.xrSession === undefined) {
      cursor.visible = false;
      return;
    }
    cursor.visible = true;

    this.player.head.getWorldPosition(this.tmpHead);
    const snapped = this.snapTarget !== null && this.snapPosition(this.tmpPos);
    if (!snapped) {
      // Repouso: ponta do dedo indicador direito.
      this.player.indexTipSpaces.right.getWorldPosition(this.tmpPos);
    }
    cursor.position.copy(this.tmpPos);
    // Billboard: o anel olha para a cabeça do usuário.
    cursor.lookAt(this.tmpHead);
    const scale = snapped ? 1.4 : 1;
    cursor.scale.setScalar(scale);
    this.ringMaterial?.color.set(snapped ? CURSOR_SNAP_COLOR : CURSOR_REST_COLOR);
  }

  /**
   * Posição de snap: centro do alvo + 1 cm em direção à cabeça.
   * Retorna false quando não dá para resolver o alvo (cai para o repouso).
   */
  private snapPosition(out: Vector3): boolean {
    const target = this.snapTarget;
    if (!target) return false;
    const nodeId = target.getValue(LevelTag, 'id');
    if (!nodeId) return false;
    const obj = this.world.getSceneObject(nodeId);
    if (!obj) return false;
    obj.getWorldPosition(out);
    this.tmpDir.copy(this.tmpHead).sub(out).normalize().multiplyScalar(SNAP_OFFSET_M);
    out.add(this.tmpDir);
    return true;
  }
}
