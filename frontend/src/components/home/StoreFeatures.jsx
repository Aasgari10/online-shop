// src/components/home/StoreFeatures.jsx
function StoreFeatures() {
  const features = [
    {
      icon: '🚚',
      title: 'ارسال رایگان',
      description: 'برای سفارش‌های بالای ۲ میلیون تومان'
    },
    {
      icon: '🔄',
      title: 'بازگشت کالا',
      description: 'تا ۷ روز کاری بدون سوال'
    },
    {
      icon: '🛡️',
      title: 'ضمانت اصالت',
      description: 'همراه با گارانتی معتبر'
    },
    {
      icon: '💬',
      title: 'پشتیبانی ۲۴/۷',
      description: 'پاسخگویی سریع و حرفه‌ای'
    }
  ];

  return (
    <div className="w-full py-12 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {features.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100 transition duration-300 border border-gray-100 hover:border-[#800E2F]/20 group"
            >
              <div className="w-14 h-14 rounded-full bg-[#800E2F]/10 flex items-center justify-center text-3xl mb-3 group-hover:bg-[#800E2F]/20 transition">
                {item.icon}
              </div>
              <h4 className="font-bold text-gray-800 text-sm md:text-base">{item.title}</h4>
              <p className="text-xs text-gray-500 mt-1">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StoreFeatures;