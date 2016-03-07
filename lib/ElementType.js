/**
 * Copyright 2016 Henning Treu
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Slider }      from './Slider';
import { Colorpicker } from './Colorpicker';
import { Switch }      from './Switch';
import { Text }        from './Text';
import { Group }       from './Group';


class ElementType {
  constructor() {
    this.SWITCH_ELEMENT       = 'Switch';
    this.SLIDER_ELEMENT       = 'Slider';
    this.COLORPICKER_ELEMENT  = 'Colorpicker';
    this.TEXT_ELEMENT         = 'Text';
    this.GROUP_ELEMENT        = 'Group';

    this.elementFactory = {};
    this.elementFactory[this.SWITCH_ELEMENT]       = Switch;
    this.elementFactory[this.SLIDER_ELEMENT]       = Slider;
    this.elementFactory[this.COLORPICKER_ELEMENT]  = Colorpicker;
    this.elementFactory[this.TEXT_ELEMENT]         = Text;
    this.elementFactory[this.GROUP_ELEMENT]        = Group;
  };
}

module.exports = { ElementType };
