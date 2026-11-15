// 샘플 재판(TRD §10 데모 모드). AI 를 부르지 않고 끝까지 볼 수 있게 미리 적어 둔 재판이다.
// 분석 내용은 이 파일이 단일 정의다. 네트워크가 끊겨도 뜨도록 JSON 을 따로 받아 오지 않는다.
import type { TrialAnalysis } from '../types/trial';

export type SampleKey = 'bottle' | 'earphone';

export type SampleTrial = {
  key: SampleKey;
  /** 홈 화면의 버튼 문구 */
  label: string;
  reason: string;
  /** 캐릭터와 같은 스타일의 원래 물건 그림. */
  sourceImage: string;
  /** 미리 만든 캐릭터 이미지. 없으면 폴백 캐릭터를 쓴다. */
  characterImage?: string;
  /** 미리 만든 변론 mp3. 없으면 기기 음성으로 읽는다. */
  speechAudio?: string;
  analysis: TrialAnalysis;
};

export const SAMPLE_TRIALS: Record<SampleKey, SampleTrial> = {
  bottle: {
    key: 'bottle',
    label: '물통 (무죄 샘플)',
    reason: '겉에 흠집이 많아서 버리려고요',
    sourceImage: '/demo/bottle/source.png',
    characterImage: '/demo/bottle/character.png',
    speechAudio: '/demo/bottle/defense.mp3',
    analysis: {
      objectName: '물통',
      visibleObservations: ['겉면에 긁힌 자국이 여러 개 보임', '뚜껑이 닫혀 있고 몸통이 찌그러지지 않음'],
      unknowns: ['안쪽 위생 상태', '물이 새는지 여부', '재질이 상했는지 여부'],
      plausibleOptions: ['keep', 'discard'],
      defendantName: '물통 씨',
      defenseSpeech:
        '판사님, 제 몸에 흠집이 좀 났지만 그게 제 마지막을 뜻하진 않아요! 안쪽 상태를 먼저 확인해 주세요. 제가 여전히 쓸 만하다면 한 번만 더 기회를 주세요!',
      keepTip: '안쪽을 씻은 뒤 금이 갔는지, 색이 변했는지, 냄새가 나는지, 물이 새는지 확인하세요.',
      discardTip: '재질 표시와 지역 배출 지침을 확인하고, 뚜껑과 몸통을 나눠 알맞게 분리배출하세요.',
      safetyNote: '사진만으로는 계속 써도 안전한지 판정할 수 없습니다.',
      characterBrief: '겉면에 긁힌 자국이 있는 파란색 물통, 둥근 몸통과 남색 원형 뚜껑',
      voiceDirection: '살짝 떨리지만 씩씩한 목소리로, 억울함을 호소하듯 조금 빠르게',
    },
  },
  earphone: {
    key: 'earphone',
    label: '이어폰 (유죄 샘플)',
    reason: '한쪽이 안 들려요',
    sourceImage: '/demo/earphone/source.png',
    characterImage: '/demo/earphone/character.png',
    analysis: {
      objectName: '무선 이어폰',
      visibleObservations: ['흰색 이어폰 한 쌍과 충전 케이스가 보임', '겉면에 눈에 띄는 깨짐은 보이지 않음'],
      unknowns: ['한쪽이 들리지 않는 원인', '배터리 상태', '기기 연결 설정 문제인지 여부'],
      plausibleOptions: ['repair', 'keep', 'discard'],
      defendantName: '이어폰 씨',
      defenseSpeech:
        '판사님, 한쪽이 조용해졌다고 제가 끝난 건 아닐지도 몰라요! 배터리가 바닥났거나 연결이 꼬였을 수도 있어요. 버리시기 전에 다시 연결해 보고 충전도 한 번만 확인해 주세요!',
      keepTip: '기기에서 등록을 지우고 다시 연결한 다음, 양쪽을 충분히 충전하고 소리가 나는지 확인하세요.',
      discardTip: '배터리가 들어 있어 일반 쓰레기로 버리면 안 됩니다. 소형 전자제품이나 폐배터리 수거함 등 지역 배출 지침을 확인하세요.',
      safetyNote: '사진만으로는 고장 원인을 알 수 없습니다. 배터리가 든 제품은 실제로 부수거나 태우면 안 됩니다.',
      characterBrief: '흰색 무선 이어폰 한 쌍과 모서리가 둥근 흰색 충전 케이스',
      voiceDirection: '조금 풀이 죽었지만 포기하지 않는 목소리로, 또박또박 간절하게',
    },
  },
};

export const SAMPLE_KEYS = Object.keys(SAMPLE_TRIALS) as SampleKey[];
