# Открываем файл в бинарном режиме
with open('Readme-old.txt', 'rb') as file:
    binary_data = file.read()

# Декодируем данные, предполагая, что они в кодировке 'shift_jis'
decoded_text = binary_data.decode('shift_jis', errors='ignore')

print(decoded_text)
