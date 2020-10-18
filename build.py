import os
import subprocess
import shutil
import datetime
import pathlib
from PIL import Image
import numpy as np

SHADER_MINIFIER = 'tools/shader_minifier.exe'
CLOSURE_COMPILER = 'tools/closure-compiler_20200719.jar'
ZOPFLIPNG = 'tools/zopflipng_1_0_3_5.exe'

BUILD = 'build'
TMP = BUILD + '/temp'
BUDGET = 4096

# HTML Bootstrap code, this reads PNG data and executes it as Javascript
BOOTSTRAP = (
    '<canvas id=F>'
    '<canvas id=V>'
    '<img onload=C=V.getContext`2d`;'
    'for($=_=\'\';X=C.getImageData(0,0,1,!C.drawImage(this,$--,0)).data[0];'
    '_+=String.fromCharCode(X));(1,eval)(_) src=#>'
)


def binaryFileToImage(input, filename):
    jsarray = np.fromfile(input, dtype='uint8')
    # 0 at the end to tell javascript to stop reading png image
    jsarray = np.append(jsarray, [0])
    img = Image.new('L', (len(jsarray), 1))
    img.putdata(jsarray)
    img.save(filename)


def minifyShader(name, rename=True):
    outputFileName = TMP + '/stripped_' + name
    outputFileName2 = TMP + '/minified_' + name
    outputFileName4 = TMP + '/noheaders_' + name
    outputHeader = TMP + '/minified_header.glsl'

    # Add header into all shaders
    with open('src/header.glsl') as input, open(outputFileName, 'w') as output:
        for line in input:
            output.writelines(line)

    with open('src/' + name) as input, open(outputFileName, 'a') as output:
        for line in input:
              # We want to strip this so shader minifier can read the file
            if (line.startswith('precision highp float;')
                or line.startswith('precision highp sampler3D;')
                or line.startswith('#version 300 es')
                ):
                pass
            else:
                output.writelines(line)

    args = [
        SHADER_MINIFIER,
        '--preserve-externals',
        '--format', 'none',
        '--field-names', 'rgba',
        '--no-renaming-list', 'H,J,N,R,U,V,main',
        '-v',
        '-o', outputFileName2,
        outputFileName
    ]
    if not rename:
        args.insert(1, '--no-renaming')
    subprocess.call(args)

    # Separate shader code and shared header
    shaderSrc = None
    headerSrc = None
    with open(outputFileName2) as input, open(outputFileName4, 'w') as output:
        line = '\\n'.join([x.replace('\n', '') for x in input.readlines()])
        index = line.find('out ')
        # Also strip out vec4 O, it's added in Javascript
        shaderSrc = line[index + len('out vec4 O'):]
        output.writelines(shaderSrc)
        with open(outputHeader, 'w') as oheader:
            headerSrc = line[0:index]
            oheader.writelines(headerSrc)

    return (shaderSrc, headerSrc)


def renameWebgl(inputFilename):
    renamed = TMP + '/renamed_main.js'
    newNames = {}
    with open('src/webgl.csv') as input:
        for line in input:
            if line:
                parts = line.split(',')
                newNames[parts[0].strip()] = parts[1].strip().rstrip()
    with open(inputFilename) as input, open(renamed, 'w') as output:
        for line in input:
            for key, value in newNames.items():
                line = line.replace(key, value)
            output.writelines(line)
    return renamed


def compile():
    if (os.path.isdir(TMP)):
        shutil.rmtree(TMP)
    pathlib.Path(TMP).mkdir(parents=True)

    # Minify shaders with Shader Minifier
    (main, header) = minifyShader('render.glsl')
    shadows = minifyShader('shadows.glsl', rename=False)[0]
    merge = minifyShader('merge.glsl', rename=False)[0]
    blur = minifyShader('blur.glsl')[0]

    # Combine all Javascript and glsl shaders to a single file
    playerCode = ''
    with open('src/music.js') as input:
        playerCode = input.read()
    injectedName = TMP + '/injected_main.js'
    with open('src/main.js') as input, open(injectedName, 'w') as output:
        for line in input:
            line = line.replace('@RENDER', main)
            line = line.replace('@SHADOWS', shadows)
            line = line.replace('@MERGE', merge)
            line = line.replace('@BLUR', blur)
            line = line.replace('@HEADER', header)
            line = line.replace('@PLAYER', playerCode)
            output.writelines(line)

    # Run Google Closure Compiler on the combined file
    jsOutputName = TMP + '/minified_main.js'
    subprocess.call('java -jar ' + CLOSURE_COMPILER
                    + ' --compilation_level ADVANCED_OPTIMIZATIONS'
                    + ' --language_out ECMASCRIPT_2019'
                    + ' --js ' + injectedName
                    + ' --externs src/extern.js '
                    + ' --js_output_file ' + jsOutputName
                    , shell=True)

    # Do "manual" modifications to final file
    withContextName = TMP + '/contextified_main.js'
    with open(jsOutputName) as input, open(withContextName, 'w') as output:
        for index, line in enumerate(input):
            line = line.replace('\'use strict\';', '')
            if (index == 0):
                line = 'var G,' + line[4:]
            line = line.replace('G.getExtension("EXT_color_buffer_float")',
                'with(G){G.getExtension("EXT_color_buffer_float")')
            line = line.replace('G.', '')
            line = line.replace('1E-5', '.00001')
            line = line.replace('1e-05', '.00001')
            line = line.replace('8E-4', '.0008')
            line = line.replace('1e-09', '.000000001')
            line = line.replace('if(0.', 'if(.0')
            line = line.replace('"', '\'')
            line = line.replace('\n', '')
            output.writelines(line)
        output.writelines('}')

    # Rename WebGL functions
    renamedName = renameWebgl(withContextName)

    # Convert final Javascript file into PNG image
    unoptimizedPng = TMP + "/unoptimized_png.png"
    binaryFileToImage(renamedName, unoptimizedPng)

    # Compress PNG file with excess amount of iterations
    tmpZopflipng = TMP + '/zopflipng.png'
    subprocess.call([ZOPFLIPNG, '-y', '--iterations=99999',
        unoptimizedPng, tmpZopflipng])

    # Combine PNG and HTML bootstrap code
    datestr = datetime.datetime.now().strftime('%Y-%m-%dT%H-%M-%S-%z')
    finalEntryName = BUILD + '/VIRGO_1302_' + datestr + '.html'

    with open(tmpZopflipng, 'rb') as input, \
        open(finalEntryName, 'wb') as output:

        # Remove IEND and checksum
        data = input.read(os.path.getsize(tmpZopflipng) - 4 * 3)
        output.write(data)

        # We have to ensure PNG data doesn't leave open <, if it does close it
        tagOpen = data.rfind('<'.encode('utf-8'))
        tagClose = data.rfind('>'.encode('utf-8'))
        bootstrapCode = BOOTSTRAP
        if tagOpen > tagClose:
            print("Closing tag > required before bootstrap code")
            bootstrapCode = '>' + bootstrapCode

        # Write HTML at the end of the PNG data
        output.write(bootstrapCode.encode('utf-8'))

    totalBytes = os.path.getsize(finalEntryName)
    print('Entry filesize {0} bytes. From budjet {1} bytes'.format(
        totalBytes, totalBytes - BUDGET))


compile()
print('Done!')
