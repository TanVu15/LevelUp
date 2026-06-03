export interface Quote {
  text: string;
  author: string;
  mode: 'discipline' | 'motivation';
}

export const QUOTES: Quote[] = [
  {
    text: "Motivation là thứ giúp bro bắt đầu. Discipline mới là thứ đưa bro vươn tới đỉnh cao S-Rank.",
    author: "Hệ Thống Thiết Kỷ",
    mode: 'discipline'
  },
  {
    text: "Đừng dừng lại. Cứ tiếp tục đổ mồ hôi và mài giũa bản thân. Chiến đấu tiếp đi bro!",
    author: "Steel Mindset",
    mode: 'discipline'
  },
  {
    text: "Nỗi đau bên trong là lời mời gọi vào tuyệt vọng, hay là dấu hiệu của một sức mạnh mới đang trỗi dậy?",
    author: "The Ascendant",
    mode: 'discipline'
  },
  {
    text: "Đừng đợi có hứng mới tập. Hãy bắt cơ bắp phục tùng ý chí.",
    author: "Đại Lộ Kỷ Luật",
    mode: 'discipline'
  },
  {
    text: "One Day or Day One. Sự lựa chọn hoàn toàn nằm ở bạn. Hôm nay là ngày số 1 hay chỉ là ước mơ xa vời?",
    author: "Steel Will",
    mode: 'discipline'
  },
  {
    text: "Tiền rò rỉ là rò rỉ sức mạnh. Kiểm soát dòng chảy tài chính chính là kiểm soát lãnh thổ của mình.",
    author: "Bản Lĩnh Tài Chính",
    mode: 'discipline'
  },
  {
    text: "Thành công không phải là ngẫu nhiên. Nó là kết quả của việc EAT, PRAY, TRAIN, STUDY, WORK lặp lại mỗi ngày.",
    author: "Ascent Protocol",
    mode: 'discipline'
  },
  {
    text: "Chỉ có kẻ yếu mới viện lý do. Kẻ mạnh chỉ hỏi: Làm thế nào?",
    author: "No Excuses",
    mode: 'discipline'
  },
  {
    text: "Hôm nay, hãy rèn luyện cơ thể và trí tuệ như thể ngày mai bước vào hầm ngục S-Rank.",
    author: "The Ascendant",
    mode: 'discipline'
  },
  {
    text: "Không có giới hạn nào cả. Chỉ có các thử thách cần phá vỡ.",
    author: "Iron Resolve",
    mode: 'discipline'
  },

  // Motivation Mode quotes (slightly softer, energizing)
  {
    text: "Cố lên bro! Mỗi bước đi nhỏ hôm nay đều đưa bạn tới gần phiên bản tối thượng của chính mình.",
    author: "Động lực mỗi ngày",
    mode: 'motivation'
  },
  {
    text: "Hãy tự hào về hành trình bạn đang đi. Bạn đang tốt hơn chính mình ngày hôm qua rồi!",
    author: "Ascent Leader",
    mode: 'motivation'
  },
  {
    text: "Hãy tin tưởng vào quá trình. Ánh sáng rực rỡ nhất sẽ xuất hiện sau bóng tối sâu thẳm nhất.",
    author: "The Ascendant",
    mode: 'motivation'
  },
  {
    text: "Năng lượng tích lũy hôm nay sẽ hóa bão tố ngày mai. Tiến lên nào chiến binh!",
    author: "Sức Mạnh Ý Chí",
    mode: 'motivation'
  }
];
