const fs = require('fs');
const file = './apps/mobile/src/app/auth/profile-setup.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { pickAndProcessImage } from '../../utils/image.utils'",
  "import { pickAndProcessImage, uploadImageToApi } from '../../utils/image.utils'"
);

content = content.replace(
  /const pickImage = async \(\) => \{[\s\S]*?\}\s*const validateForm/m,
  `const pickImage = async (source: 'library' | 'camera' = 'library') => {
    try {
      const image = await pickAndProcessImage({ allowsEditing: true, source })
      if (!image) return
      
      const result = await uploadImageToApi(image, '/upload/avatar')
      if (result?.url) {
        setPhoto(result.url)
      }
    } catch (err: any) {
      Alert.alert('Xatolik', err.message || 'Rasm yuklanmadi. Qayta urining.')
    }
  }

  const validateForm`
);

content = content.replace(
  /let profileImageUrl: string \| null = null[\s\S]*?const updated =/m,
  `let profileImageUrl: string | null = photo

      const updated =`
);

fs.writeFileSync(file, content);
