from flask import Flask, request, send_file
from flask_cors import CORS
from keras.models import load_model
import numpy as np
import cv2
from tensorflow.keras.optimizers import Adam
import tensorflow as tf
# Carga del modelo .h5 y funciones para procesar la imagen

app = Flask(__name__)
CORS(app)

superresolution_textures_path = 'superresolution_textures/'
@app.route('/procesar_imagen', methods=['POST'])
def procesar_imagen():
    #print(request.files)
    imagen = request.files['imagen']
    '''get texture path from image'''
    texture_path=imagen.filename
    print(texture_path)
    FCN_FSRCNN(texture_path)
    FSRCNN_x3(texture_path)
    FSRCNN_best(texture_path)
    return "holass"

def FCN_FSRCNN(texture_path):
    '''load h5 model from ../models/'''
    model = load_model('models/model3_FCN_FSRCNN.h5',compile=False)
    print("Modelo cargado")
    '''compile model'''
    model.compile(optimizer=Adam(lr=0.0003), loss='mse', metrics=['mse'])
    print("Modelo compilado")
    testimg = []
    '''load image'''
    GT = cv2.imread("textures/"+texture_path)
    GT = np.asarray(GT)
    h = GT.shape[0]
    l = GT.shape[1]
    #img1 = cv2.resize(GT,(int(l/2),int(h/2)),interpolation = cv2.INTER_CUBIC)
    img1=GT
    img1 = np.asarray(img1)
    testimg.append(img1)
    testimg = np.asarray(testimg)
    print(testimg.shape)
    fin =(model.predict(testimg)[0])
    fin = cv2.resize(fin, (GT.shape[1]*2, GT.shape[0]*2), interpolation=cv2.INTER_CUBIC)
    fin = np.asarray(fin)
    print(fin.shape)
    cv2.imwrite("textures/superresolution_textures/FSRCNN_1_"+texture_path,fin)
    print("Imagen guardada"+ " superresolution_textures/FSRCNN_1_"+texture_path)

def FSRCNN_x3(texture_path):
    '''load FSRCNN-x3.h5 model from ../models/'''

    model = tf.keras.models.load_model('models/FSRCNN-x3-svs.h5')   
    print("Modelo cargado x3")
    '''make prediction'''
    img = cv2.imread("textures/"+texture_path)
    img = np.asarray(img)
    img = np.expand_dims(img, axis=0)
    img = img.astype(np.float32)/255.0
    print(img.shape)
    pred = model.predict(img)
    print(pred.shape)
    pred = pred[0]
    pred = pred*255.0
    pred = np.clip(pred, 0, 255).astype(np.uint8)
    print(pred.shape)
    cv2.imwrite("textures/superresolution_textures/FSRCNN_2_"+texture_path,pred)
    print("Imagen guardada"+ " superresolution_textures/FSRCNN_2_"+texture_path)

def FSRCNN_best(texture_path):
    '''load FSRCNN-best.h5 model from ../models/'''
    model =load_model('models/FSRCNN_best.h5',compile=False)   
    model.compile(optimizer=Adam(lr=0.0003), loss='mse', metrics=['mse'])
    print("Modelo cargado best")
    '''make prediction'''
    img = cv2.imread("textures/"+texture_path)
    img = cv2.resize(img, (256, 256), interpolation=cv2.INTER_CUBIC)
    img = np.asarray(img)
    img = np.expand_dims(img, axis=0)
    img = img.astype(np.float32)/255.0
    print(img.shape)
    pred = model.predict(img)
    print(pred.shape)
    pred = pred[0]
    pred = pred*255.0
    '''bgr to rgb'''
    pred = pred[...,::-1]
    pred = np.clip(pred, 0, 255).astype(np.uint8)
    print(pred.shape)
    cv2.imwrite("textures/superresolution_textures/FSRCNN_3_"+texture_path,pred)
    print("Imagen guardada"+ " superresolution_textures/FSRCNN_3_"+texture_path)

if __name__ == '__main__':
    app.run()
